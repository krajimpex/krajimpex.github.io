/* Loads Three.js (from the import map in the page head) and shares a few helpers.
   A classic script that uses dynamic import(), so pages still work when opened straight from disk. */
(function(){
  'use strict';
  var cache=null;
  function hasWebGL(){try{var c=document.createElement('canvas');return !!(window.WebGL2RenderingContext&&c.getContext('webgl2'));}catch(e){return false;}}
  function load(){
    if(cache)return cache;
    if(!hasWebGL())return (cache=Promise.reject(new Error('no-webgl')));
    cache=Promise.all([
      import('three'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]).then(function(m){
      return {THREE:m[0],RoomEnvironment:m[1].RoomEnvironment,EffectComposer:m[2].EffectComposer,RenderPass:m[3].RenderPass,UnrealBloomPass:m[4].UnrealBloomPass,OutputPass:m[5].OutputPass};
    });
    return cache;
  }
  var mobile=function(){return Math.min(window.innerWidth,window.innerHeight)<700||(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches);};
  function setup(K,canvas,opts){
    var T=K.THREE;opts=opts||{};
    var r=new T.WebGLRenderer({canvas:canvas,antialias:!mobile(),powerPreference:'high-performance'});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile()?1.35:1.75));
    r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=opts.exposure||1;
    r.outputColorSpace=T.SRGBColorSpace;r.setClearColor(opts.clear!=null?opts.clear:0x000000,1);
    var pm=new T.PMREMGenerator(r),env=pm.fromScene(new K.RoomEnvironment(),.04).texture;pm.dispose();
    var scene=new T.Scene();scene.environment=env;
    var camera=new T.PerspectiveCamera(opts.fov||32,1,.05,60);
    // multisampled target: clean, anti-aliased edges through post-processing
    var rt=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:mobile()?2:4});
    var comp=new K.EffectComposer(r,rt);comp.addPass(new K.RenderPass(scene,camera));
    var bloom=new K.UnrealBloomPass(new T.Vector2(256,256),opts.bloom||.6,opts.bloomRadius||.4,opts.threshold||.82);
    // keep the glow tight around highlights; the widest blur levels otherwise wash dark grounds to grey
    var bf=bloom.compositeMaterial&&bloom.compositeMaterial.uniforms.bloomFactors;
    if(bf)bf.value=opts.factors||[1,.55,.22,.07,.02];
    comp.addPass(bloom);comp.addPass(new K.OutputPass());
    function size(){
      var w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
      r.setSize(w,h,false);comp.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
      if(opts.onResize)opts.onResize(w,h);
    }
    size();window.addEventListener('resize',function(){clearTimeout(size.t);size.t=setTimeout(size,120);});
    return {renderer:r,scene:scene,camera:camera,composer:comp,bloom:bloom,resize:size};
  }
  // runs frame(t, dt) only while el is on screen and the tab is visible
  function loop(el,frame){
    var on=false,raf=0,last=0;
    function tick(ms){var t=ms/1000,dt=Math.min(.05,last?t-last:.016);last=t;frame(t,dt);raf=requestAnimationFrame(tick);}
    new IntersectionObserver(function(es){var v=es[0].isIntersecting;
      if(v&&!on){on=true;last=0;raf=requestAnimationFrame(tick);}else if(!v&&on){on=false;cancelAnimationFrame(raf);}
    },{rootMargin:'120px'}).observe(el);
    frame(performance.now()/1000,.016);
  }
  function rng(seed){return function(){seed=(seed*16807)%2147483647;return seed/2147483647;};}
  function glowTexture(T){
    var s=128,c=document.createElement('canvas');c.width=c.height=s;var x=c.getContext('2d'),m=s/2;
    var g=x.createRadialGradient(m,m,0,m,m,m);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g;x.fillRect(0,0,s,s);var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
  }
  /* a jeweller's light tent as an equirectangular texture: bright surround, dark bars for contrast */
  function studio(T){

      var c=document.createElement('canvas');c.width=1024;c.height=512;var x=c.getContext('2d');
      var bg=x.createLinearGradient(0,0,0,512);bg.addColorStop(0,'#ffffff');bg.addColorStop(.35,'#d9dbe0');bg.addColorStop(.5,'#9fa2a9');bg.addColorStop(.62,'#55575e');bg.addColorStop(1,'#b8bac0');
      x.fillStyle=bg;x.fillRect(0,0,1024,512);
      function box(u,v,w,h,col){x.fillStyle=col||'#fff';x.fillRect(u*1024,v*512,w*1024,h*512);}
      for(var i=0;i<14;i++)box(i/14+(i%3)*.01,.0,.016+(i%2)*.014,1,'#030304');box(0,.47,1,.05,'#0a0a0c');           // dark bars: the contrast that makes facets flash
      box(.36,.03,.28,.1);box(.05,.12,.12,.06);box(.78,.14,.1,.08);   // softboxes
      for(i=0;i<8;i++)box(i/8+.04,.33,.018,.14,'#ffffff');
      box(.16,.6,.1,.05,'#f6e3a1');box(.6,.63,.08,.05,'#bcd7ff');box(.84,.58,.05,.08,'#ffc6ee');
      for(i=0;i<50;i++){var u=Math.random(),v=.1+Math.random()*.5,s=.003+Math.random()*.008;box(u,v,s,s*2,'#fff');}
      var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=T.LinearFilter;t.wrapS=T.RepeatWrapping;return t;
  }
  /* diamond material: reflection + three-wavelength refraction with one internal bounce (fire) */
  function crystal(T,studio,o){return new T.ShaderMaterial({transparent:true,
      uniforms:{uEnv:{value:studio},uRot:{value:0},uIOR:{value:o.ior},uDisp:{value:o.disp||0},uF0:{value:o.f0||.17},uBoost:{value:o.boost||2},
        uTint:{value:new T.Color(o.tint||0xffffff)},uFrost:{value:o.frost||0},uScatter:{value:o.scatter||0},uGlow:{value:new T.Color(0)},uOpacity:{value:1}},
      vertexShader:'attribute float aFacet;varying float vFacet;varying vec3 vW;varying vec3 vIC;void main(){vec4 p=vec4(position,1.);vIC=vec3(1.);vFacet=aFacet;\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvIC=instanceColor;\n#endif\nvec4 w=modelMatrix*p;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader:[
        'uniform sampler2D uEnv;uniform float uRot,uIOR,uDisp,uF0,uBoost,uFrost,uOpacity,uScatter;uniform vec3 uTint,uGlow;varying vec3 vW;varying vec3 vIC;varying float vFacet;',
        'vec3 env(vec3 d){d=normalize(d);float c=cos(uRot),s=sin(uRot);d.xz=mat2(c,-s,s,c)*d.xz;vec2 uv=vec2(atan(d.z,d.x)/6.28318+.5,asin(clamp(d.y,-1.,1.))/3.14159+.5);return texture2D(uEnv,uv).rgb;}',
        'vec3 bounce(vec3 r,vec3 n){vec3 m=normalize(vec3(n.x,-abs(n.y)-.4,n.z));vec3 b=reflect(r,m);vec3 o=refract(b,-m,uIOR*.62);o=dot(o,o)<.01?reflect(b,m):o;if(uScatter>0.){float h=vFacet;float a=h*6.2832*uScatter;float c=cos(a),s=sin(a);o.xz=mat2(c,-s,s,c)*o.xz;o.y=mix(o.y,o.y*(h*2.-1.),uScatter*.7);}return o;}',
        'void main(){vec3 I=normalize(vW-cameraPosition);vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));if(dot(N,I)>0.)N=-N;',
        'float F=uF0+(1.-uF0)*pow(1.-max(dot(-I,N),0.),5.);',
        'vec3 rr=refract(I,N,1./uIOR),rg=refract(I,N,1./(uIOR+uDisp)),rb=refract(I,N,1./(uIOR+2.*uDisp));',
        'vec3 inner=vec3(env(bounce(rr,N)).r,env(bounce(rg,N)).g,env(bounce(rb,N)).b);',
        'vec3 tint=uTint*vIC;vec3 col=mix(inner*tint,env(reflect(I,N)),F)*uBoost;',
        'float l=dot(col,vec3(.299,.587,.114));col=mix(col,tint*(l*.55+.06),uFrost);',
        'col+=uGlow;gl_FragColor=vec4(col,uOpacity);',
        '#include <tonemapping_fragment>',
        '#include <colorspace_fragment>',
        '}'].join('\n')});}
  /* real cut geometry: a 57-facet round brilliant (and oval, pear, cushion, princess variants), or an emerald step cut */
  function geometry(T,shape,fold){
    var P=[],tri=function(a,b,c){P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);};
    var quad=function(a,b,c,d){tri(a,b,c);tri(a,c,d);};
    var g;
    if(shape==='emerald'){
      // step cut: an octagonal outline (corners cut), three crown steps, three pavilion steps to a keel
      var w=1.42,h=1,c=.2,O=[[w/2-c,h/2],[w/2,h/2-c],[w/2,-h/2+c],[w/2-c,-h/2],[-w/2+c,-h/2],[-w/2,-h/2+c],[-w/2,h/2-c],[-w/2+c,h/2]];
      var rings=[[.64,.31],[.76,.24],[.88,.14],[1,.035],[1,0],[.82,-.2],[.62,-.4],[.4,-.56],[.16,-.66]];
      var R=rings.map(function(r){return O.map(function(o){return [o[0]*r[0],r[1],o[1]*r[0]];});});
      for(var i=0;i<8;i++){var j=(i+1)%8;tri([0,.31,0],R[0][i],R[0][j]);}
      for(var k=0;k<R.length-1;k++)for(i=0;i<8;i++){j=(i+1)%8;quad(R[k][i],R[k][j],R[k+1][j],R[k+1][i]);}
      var L=R[R.length-1];for(i=0;i<8;i++){j=(i+1)%8;tri(L[i],L[j],[0,-.68,0]);}
    }else{
      // 57-facet round brilliant: table 57%, crown 34.5°, pavilion 40.8°, then reshaped for fancy outlines
      var pt=function(r,a,y){return [r*Math.cos(a),y,r*Math.sin(a)];},D=Math.PI/180;
      var gy=.03,cy=gy+.295,A=[],B=[],C=[],G=[],E=[];
      // fold 8 = the classic 57 facets; fold 16 doubles every facet ring for large display stones
      var M=fold||8,st=360/M;
      for(var q=0;q<M;q++){A.push(pt(.57,q*st*D,cy));B.push(pt(.79,(q*st+st/2)*D,gy+.295*(.21/.43)));E.push(pt(.23,(q*st+st/2)*D,-.863*.77));}
      for(q=0;q<2*M;q++){C.push(pt(1,q*st/2*D,gy));G.push(pt(1,q*st/2*D,0));}
      var top=[0,cy,0],cul=[0,-.863,0],n8=function(x){return (x+M)%M;},n16=function(x){return (x+2*M)%(2*M);};
      for(q=0;q<M;q++){
        tri(top,A[q],A[n8(q+1)]);                                  // table
        tri(A[q],B[q],A[n8(q+1)]);                                 // star
        tri(A[q],B[n8(q-1)],C[2*q]);tri(A[q],C[2*q],B[q]);          // bezel (kite)
        tri(B[q],C[2*q],C[n16(2*q+1)]);tri(B[q],C[n16(2*q+1)],C[n16(2*q+2)]); // upper girdle
        tri(G[2*q],G[n16(2*q+1)],E[q]);tri(G[n16(2*q+1)],G[n16(2*q+2)],E[q]); // lower girdle
        tri(E[n8(q-1)],G[2*q],E[q]);tri(E[n8(q-1)],E[q],cul);      // pavilion main
      }
      for(q=0;q<2*M;q++)quad(C[q],C[n16(q+1)],G[n16(q+1)],G[q]);    // girdle
      // fancy outlines
      for(var v=0;v<P.length;v+=3){
        var x=P[v],z=P[v+2],r=Math.hypot(x,z),a=Math.atan2(z,x);
        if(shape==='oval'){P[v]=x*1.36;}
        else if(shape==='pear'){var u=z;P[v+2]=z*1.28+(u>0?u*u*.1:0);P[v]=x*(1-Math.max(0,u)*.6)*(1+Math.max(0,-u)*.05);}
        else if(shape==='cushion'||shape==='princess'){var nn=shape==='cushion'?4:14,s=1/Math.pow(Math.pow(Math.abs(Math.cos(a)),nn)+Math.pow(Math.abs(Math.sin(a)),nn),1/nn);
          if(r>1e-6){var k2=s;P[v]=x*k2;P[v+2]=z*k2;}
          if(shape==='princess'){P[v+1]=P[v+1]<0?P[v+1]*1.12:P[v+1]*.8;}}
      }
    }
    g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));
    // each facet (triangle) gets its own fixed value, so light inside the stone scatters facet by facet
    var F=new Float32Array(P.length/3),fr=VD3.rng(shape.length*97+13);for(var f=0;f<F.length;f+=3){var hv=fr();F[f]=F[f+1]=F[f+2]=hv;}g.setAttribute('aFacet',new T.BufferAttribute(F,1));
    g.computeBoundingSphere();return g;
  }

  window.VD3={cutGeometry:geometry,load:load,setup:setup,loop:loop,rng:rng,mobile:mobile,glowTexture:glowTexture,studio:studio,crystal:crystal,
    still:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches};
})();
