/* How a diamond is grown — a scroll-driven 3D sequence of chemical vapour deposition (CVD).
   The section is tall; its stage sticks to the viewport and scroll progress (0→1) scrubs one timeline:
   reactor → cutaway → seeds → gas → plasma → growth → rough → cut → declared.
   Without WebGL the steps are shown as a plain, readable list. */
(function(){
  'use strict';
  var sec=document.querySelector('.growth');if(!sec)return;
  var cv=sec.querySelector('canvas'),cards=[].slice.call(sec.querySelectorAll('.g-card')),rail=[].slice.call(sec.querySelectorAll('.g-rail li')),
      bar=sec.querySelector('.g-bar i'),counter=sec.querySelector('[data-layers]'),intro=sec.querySelector('.g-intro');
  function staticMode(){sec.classList.add('static');}
  if(!window.VD3){staticMode();return;}
  VD3.load().then(build).catch(function(e){console.warn('3D unavailable:',e&&e.message);staticMode();});

  // header turns dark while the black stage is underneath it
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){document.documentElement.classList.toggle('dark-head',es[0].isIntersecting);},{rootMargin:'0px 0px -100% 0px'}).observe(sec);

  function build(K){
    var T=K.THREE,V=T.Vector3,mob=VD3.mobile();
    var S=VD3.setup(K,cv,{fov:mob?44:34,bloom:.9,bloomRadius:.3,threshold:.9,exposure:.9,clear:0x000000,factors:[1,.6,.28,.08,.02]});
    var scene=S.scene,camera=S.camera,r=S.renderer;
    r.localClippingEnabled=true;
    scene.fog=new T.Fog(0x000000,8,19);
    scene.environmentIntensity=.55;

    var studio=VD3.studio(T);
    function crystal(o){return VD3.crystal(T,studio,o);}

    /* ---------- materials ---------- */
    var clip=new T.Plane(new V(0,0,-1),40);
    function std(o){return new T.MeshStandardMaterial(o);}
    var graphite=std({color:0x3a3f47,metalness:1,roughness:.3,clippingPlanes:[clip],side:T.DoubleSide});
    var polished=std({color:0xaab1bb,metalness:1,roughness:.2,clippingPlanes:[clip]});
    var gold=std({color:0xc9a24a,metalness:1,roughness:.24,clippingPlanes:[clip]});
    var gold2=std({color:0xc9a24a,metalness:1,roughness:.24});
    var black=std({color:0x15171b,metalness:.8,roughness:.45});
    var tube=std({color:0x8c939d,metalness:1,roughness:.22});
    var moly=std({color:0x8a8f97,metalness:1,roughness:.35});

    /* ---------- floor + reactor ---------- */
    var floor=new T.Mesh(new T.CircleGeometry(16,64),std({color:0x060708,metalness:.4,roughness:.55,envMapIntensity:.25}));floor.rotation.x=-Math.PI/2;scene.add(floor);
    var R=new T.Group();scene.add(R);
    function add(geo,mat,x,y,z,parent){var m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);(parent||R).add(m);return m;}
    add(new T.CylinderGeometry(1.78,1.86,.22,72),black,0,.11,0);
    add(new T.TorusGeometry(1.79,.012,8,120),gold2,0,.222,0).rotation.x=Math.PI/2;
    add(new T.CylinderGeometry(1.24,1.24,.12,72),graphite,0,.29,0);
    add(new T.CylinderGeometry(1.12,1.12,1.25,72,1,true),graphite,0,.965,0);
    for(var i=0;i<30;i++){var a=i/30*Math.PI*2,fin=add(new T.BoxGeometry(.04,1.12,.2),polished,Math.cos(a)*1.23,.965,Math.sin(a)*1.23);fin.rotation.y=-a;}
    [.42,1.5].forEach(function(y){add(new T.TorusGeometry(1.34,.026,10,120),gold,0,y,0).rotation.x=Math.PI/2;});
    add(new T.CylinderGeometry(1.3,1.3,.1,72),graphite,0,1.64,0);
    var dome=add(new T.SphereGeometry(1.12,64,24,0,Math.PI*2,0,Math.PI/2),graphite,0,1.69,0);dome.scale.y=.42;
    // microwave guide: vertical stub, horizontal guide, generator
    add(new T.CylinderGeometry(.2,.2,.42,40),gold,0,2.28,0);
    add(new T.BoxGeometry(1.7,.26,.4),gold,.75,2.55,0);
    add(new T.BoxGeometry(.56,.56,.56),graphite,1.78,2.55,0);
    for(i=0;i<5;i++)add(new T.BoxGeometry(.58,.016,.58),polished,1.78,2.33+i*.11,0);
    // gas lines
    var inlets=[new V(-1.12,1.18,.32),new V(-1.12,1.1,-.32)];
    inlets.forEach(function(p,k){
      var c=new T.CatmullRomCurve3([new V(-3.6,.05,p.z*2.4),new V(-2.6,.05,p.z*2.2),new V(-2.3,.6,p.z*1.8),new V(-1.9,p.y,p.z*1.3),new V(-1.3,p.y,p.z)]);
      add(new T.TubeGeometry(c,64,.032,12,false),tube);
      var v=add(new T.CylinderGeometry(.085,.085,.15,24),gold2,-2.35,.75+k*.04,p.z*1.75);v.rotation.z=.3;
    });
    // bolted flanges, top and base
    (function(){var bg=new T.CylinderGeometry(.021,.021,.05,10),bo=new T.InstancedMesh(bg,polished,72),m=new T.Matrix4(),n=0;
      [[1.705,1.265],[.37,1.205]].forEach(function(r){for(var k=0;k<36;k++){var a=(k+.5)/36*Math.PI*2;m.makeTranslation(Math.cos(a)*r[1],r[0],Math.sin(a)*r[1]);bo.setMatrixAt(n++,m);}});
      R.add(bo);})();
    // a sapphire viewing port on the chamber wall; it glows once the plasma is lit
    var portGlass=new T.MeshStandardMaterial({color:0x14080f,metalness:.2,roughness:.06,emissive:0xff4fd0,emissiveIntensity:0,clippingPlanes:[clip]});
    (function(){var a=.78,port=new T.Group();port.position.set(Math.cos(a)*1.36,1.02,Math.sin(a)*1.36);port.lookAt(Math.cos(a)*3,1.02,Math.sin(a)*3);R.add(port);
      var rim=new T.Mesh(new T.TorusGeometry(.19,.035,12,48),gold);port.add(rim);
      var tubeP=new T.Mesh(new T.CylinderGeometry(.17,.17,.16,40,1,true),graphite);tubeP.rotation.x=Math.PI/2;tubeP.position.z=-.08;port.add(tubeP);
      var gl=new T.Mesh(new T.CircleGeometry(.17,40),portGlass);gl.position.z=.005;port.add(gl);
      for(var k=0;k<8;k++){var b=new T.Mesh(new T.CylinderGeometry(.016,.016,.03,8),polished),aa=k/8*Math.PI*2;b.rotation.x=Math.PI/2;b.position.set(Math.cos(aa)*.25,Math.sin(aa)*.25,0);port.add(b);}
      var plate=new T.Mesh(new T.CylinderGeometry(.28,.28,.02,40),graphite);plate.rotation.x=Math.PI/2;plate.position.z=-.012;port.add(plate);})();
    // a pressure gauge on the gas line: its needle falls as the chamber is pumped down
    var needle;
    (function(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');
      x.fillStyle='#f1ede4';x.beginPath();x.arc(128,128,124,0,6.283);x.fill();x.strokeStyle='#2a2a2a';x.lineWidth=3;
      for(var k=0;k<=10;k++){var a=(-225+k*27)*Math.PI/180;x.beginPath();x.moveTo(128+Math.cos(a)*92,128+Math.sin(a)*92);x.lineTo(128+Math.cos(a)*(k%5?104:110),128+Math.sin(a)*(k%5?104:110));x.stroke();}
      x.fillStyle='#2a2a2a';x.font='600 22px Helvetica, Arial, sans-serif';x.textAlign='center';x.fillText('mbar',128,178);
      var tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
      var g=new T.Group();g.position.set(-2.12,1.16,.86);g.lookAt(2,2.2,6);R.add(g);
      var body=new T.Mesh(new T.CylinderGeometry(.13,.13,.05,40),[gold2,new T.MeshStandardMaterial({map:tx,roughness:.4}),gold2]);body.rotation.x=Math.PI/2;g.add(body);
      var glass=new T.Mesh(new T.CircleGeometry(.12,40),new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.12,roughness:0,envMapIntensity:1.2}));glass.position.z=.03;g.add(glass);
      needle=new T.Mesh(new T.BoxGeometry(.006,.09,.004),new T.MeshStandardMaterial({color:0x8e1520,roughness:.4}));needle.geometry.translate(0,.04,0);needle.position.z=.028;g.add(needle);
      var stem=new T.Mesh(new T.CylinderGeometry(.018,.018,.32,12),tube);stem.position.set(-2.2,.98,.78);R.add(stem);})();
    // water cooling at the base, and the generator's power cable
    var copper=std({color:0xb8743f,metalness:1,roughness:.32});
    [[-.35,0],[-.55,.12]].forEach(function(o){var a=Math.PI*1.05+o[0],c=new T.CatmullRomCurve3([new V(Math.cos(a)*1.8,.12+o[1],Math.sin(a)*1.8),new V(Math.cos(a)*2.3,.05+o[1]*.5,Math.sin(a)*2.3-.2),new V(-3.4,.04,-1.6+o[0])]);add(new T.TubeGeometry(c,48,.03,10,false),copper);});
    (function(){var c=new T.CatmullRomCurve3([new V(2.06,2.4,0),new V(2.35,1.6,-.2),new V(2.5,.4,-.5),new V(3.4,.04,-.9)]);add(new T.TubeGeometry(c,64,.04,10,false),black);})();
    // inside: pedestal and molybdenum stage
    add(new T.CylinderGeometry(.22,.3,.24,40),black,0,.47,0);
    add(new T.CylinderGeometry(.64,.64,.06,64),moly,0,.62,0);
    var stageTop=.65;

    /* ---------- seeds that become crystals ---------- */
    var seedMat=crystal({ior:2.2,f0:.12,boost:1.05,tint:0xd6cbbb,frost:.16});
    var seeds=[],SW=.19,SH0=.018,SHmax=.22,box=new T.BoxGeometry(SW,1,SW);
    for(var gx=-1;gx<=1;gx++)for(var gz=-1;gz<=1;gz++){var s=add(box,seedMat,gx*.31,0,gz*.31,scene);s.userData.home=s.position.clone();seeds.push(s);}
    var hero=seeds[4];
    hero.material=crystal({ior:2.2,f0:.12,boost:1.05,tint:0xd6cbbb,frost:.16});
    var frontMat=new T.MeshBasicMaterial({color:0xff6fe0,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
    var fronts=seeds.map(function(s){var f=add(new T.PlaneGeometry(SW*1.02,SW*1.02),frontMat,s.position.x,0,s.position.z,scene);f.rotation.x=-Math.PI/2;return f;});

    /* ---------- plasma ---------- */
    var plasmaY=1.08;
    var pMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uT:{value:0},uI:{value:0}},
      vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uT;void main(){vec3 p=position;float w=sin(p.x*9.+uT*2.1)*sin(p.y*7.+uT*1.7)*sin(p.z*8.-uT*2.4);p*=1.+w*.05;vP=p;vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uT;uniform float uI;void main(){float f=1.-abs(dot(vN,vV));float n=.5+.5*sin(vP.x*14.+uT*3.)*sin(vP.y*12.-uT*2.)*sin(vP.z*13.+uT*2.6);vec3 core=vec3(1.,.86,.98);vec3 edge=vec3(.85,.25,1.);vec3 c=mix(core,edge,smoothstep(.0,.8,f));float a=pow(1.-f,1.4)*(.7+.4*n);gl_FragColor=vec4(c*a*uI*1.1,a*uI);}'});
    var plasma=new T.Mesh(new T.SphereGeometry(.36,64,48),pMat);plasma.position.set(0,plasmaY,0);scene.add(plasma);
    var glowTex=VD3.glowTexture(T);
    var halo=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xff58d6,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));halo.position.copy(plasma.position);scene.add(halo);
    var pLight=new T.PointLight(0xff4fd0,0,4,1.6);pLight.position.copy(plasma.position);scene.add(pLight);

    /* ---------- particles: gas in, carbon down ---------- */
    function pointsMat(color,body){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uT:{value:0},uO:{value:0},uC:{value:new T.Color(color)},uS:{value:1},uH:{value:0}},
      vertexShader:'attribute vec4 aR;uniform float uT;uniform float uS;uniform float uH;varying float vA;void main(){vec3 p;float t;'+body+' vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uS*(.6+aR.w)/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform vec3 uC;uniform float uO;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(uC*a*vA*uO,a*vA*uO);}'});}
    var NG=mob?420:900,gGeo=new T.BufferGeometry(),gR=new Float32Array(NG*4),rnd=VD3.rng(5);
    for(i=0;i<NG;i++){gR[i*4]=rnd();gR[i*4+1]=rnd();gR[i*4+2]=rnd()<.82?0:1;gR[i*4+3]=rnd();}
    gGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(NG*3),3));gGeo.setAttribute('aR',new T.BufferAttribute(gR,4));
    function gasBody(which){return 'if(aR.z!='+which+'.){gl_Position=vec4(2.,2.,2.,1.);return;}t=fract(aR.x+uT*.16);vec3 a=vec3(-1.08,1.14+(aR.y-.5)*.12,(aR.y>.5?.32:-.32));vec3 c=vec3(0.,'+plasmaY.toFixed(2)+',0.);float e=t*t*(3.-2.*t);float ang=aR.y*6.28+t*5.;float rad=(1.-e)*.42;p=mix(a,c,e)+vec3(cos(ang)*rad*.4,sin(ang*1.3)*rad*.5,sin(ang)*rad);vA=.7*smoothstep(0.,.1,t)*(1.-smoothstep(.7,1.,t));';}
    var gasH=new T.Points(gGeo,pointsMat(0xbfe3ff,gasBody(0))),gasC=new T.Points(gGeo,pointsMat(0xffc46a,gasBody(1)));gasH.frustumCulled=gasC.frustumCulled=false;scene.add(gasH,gasC);
    var NC=mob?380:800,cGeo=new T.BufferGeometry(),cR=new Float32Array(NC*4);
    for(i=0;i<NC;i++){cR[i*4]=rnd();cR[i*4+1]=(rnd()*9)|0;cR[i*4+2]=rnd();cR[i*4+3]=rnd();}
    cGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(NC*3),3));cGeo.setAttribute('aR',new T.BufferAttribute(cR,4));
    var cMat=pointsMat(0xfff1d6,'float ix=mod(aR.y,3.)-1.;float iz=floor(aR.y/3.)-1.;t=fract(aR.x+uT*.55);vec3 top=vec3(ix*.31+(aR.z-.5)*.17,uH,iz*.31+(aR.w-.5)*.17);'+
      'vec3 st=vec3((aR.z-.5)*.5,'+plasmaY.toFixed(2)+'-.18,(aR.w-.5)*.5);p=mix(st,top,t*t);vA=smoothstep(0.,.15,t)*(1.-smoothstep(.85,1.,t));');
    var carbon=new T.Points(cGeo,cMat);carbon.frustumCulled=false;scene.add(carbon);

    /* ---------- the cut stone: a round brilliant ---------- */
    var prof=[new T.Vector2(.001,-.43),new T.Vector2(.26,-.2),new T.Vector2(.5,-.006),new T.Vector2(.5,.022),new T.Vector2(.43,.085),new T.Vector2(.29,.165),new T.Vector2(.001,.165)];
    var bGeo=new T.LatheGeometry(prof,24);bGeo.scale(.42,.42,.42);
    var bMat=crystal({ior:2.42,disp:.06,f0:.17,boost:1.55});
    var brill=new T.Mesh(bGeo,bMat);brill.position.set(0,1.0,0);scene.add(brill);
    var edges=new T.LineSegments(new T.EdgesGeometry(bGeo,1),new T.LineBasicMaterial({color:0xf6e3a1,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));brill.add(edges);
    var laser=new T.Mesh(new T.PlaneGeometry(.8,.005),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));scene.add(laser);
    var laserGlow=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xffb050,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));laserGlow.scale.set(.9,.1,1);scene.add(laserGlow);
    // velvet spot behind the finished stone, and a black room that closes in around it
    var spot=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0x2a2d36,transparent:true,opacity:0,depthWrite:false}));spot.position.set(0,1.0,-1.4);spot.scale.setScalar(3.2);scene.add(spot);
    var room=new T.Mesh(new T.SphereGeometry(1,48,24),new T.MeshBasicMaterial({color:0x000000,side:T.BackSide,fog:false}));room.position.set(0,1.0,0);room.visible=false;scene.add(room);

    var key=new T.SpotLight(0xfff4e6,24,14,.45,.7,1.2);key.position.set(3,6,4);key.target.position.set(0,1,0);scene.add(key,key.target);
    var rim=new T.DirectionalLight(0x9fb4ff,.6);rim.position.set(-4,3,-3);scene.add(rim);

    /* ---------- timeline ---------- */
    function cl(x){return x<0?0:x>1?1:x;}
    function ss(x){x=cl(x);return x*x*x*(x*(x*6-15)+10);}
    function seg(p,a,b){return ss((p-a)/(b-a));}
    var KEYS=[
      [0,   [4.8,2.7,6.4],[0,1.1,0]],
      [.15, [2.6,1.9,3.8],[0,.95,0]],
      [.29, [-2.5,1.75,3.0],[-.35,1.0,0]],
      [.43, [.3,1.42,3.3],[0,1.0,0]],
      [.6,  [1.3,.92,1.6],[0,.7,0]],
      [.73, [.0,1.12,1.4],[0,1.0,0]],
      [.88, [.0,1.16,1.08],[0,1.0,0]],
      [1,   [.0,1.42,1.02],[0,.99,0]]
    ];
    var cp=new V(),ct=new V(),va=new V(),vb=new V();
    function camAt(p){
      for(var k=0;k<KEYS.length-1;k++)if(p<=KEYS[k+1][0])break;
      var A=KEYS[k],B=KEYS[Math.min(k+1,KEYS.length-1)],u=B===A?0:ss((p-A[0])/(B[0]-A[0]));
      cp.copy(va.fromArray(A[1])).lerp(vb.fromArray(B[1]),u);ct.copy(va.fromArray(A[2])).lerp(vb.fromArray(B[2]),u);
      // portrait screens: step back, and look a little lower so the subject sits above the step card
      if(camera.aspect<.9){var f=1+(.9-camera.aspect)*1.4;cp.sub(ct).multiplyScalar(f).add(ct);ct.y-=.07*cp.distanceTo(ct);}
    }

    var target=0,prog=0;
    function readScroll(){var rc=sec.getBoundingClientRect(),run=rc.height-window.innerHeight;target=cl(-rc.top/run);}
    window.addEventListener('scroll',readScroll,{passive:true});window.addEventListener('resize',readScroll);readScroll();prog=target;

    var steps=cards.map(function(c){return [+c.dataset.from,+c.dataset.to];}),active=-1;
    function ui(p){
      var a=0;for(var i=0;i<steps.length;i++)if(p>=steps[i][0])a=i;
      if(a!==active){active=a;cards.forEach(function(c,i){c.classList.toggle('on',i===a);});rail.forEach(function(l,i){l.classList.toggle('on',i===a);l.classList.toggle('done',i<a);});}
      if(bar)bar.style.transform='scaleX('+p.toFixed(4)+')';
      if(intro)intro.style.opacity=(1-seg(p,.015,.06)).toFixed(3);
      if(counter){var g=seg(p,.48,.68);counter.textContent=Math.round(g*56e6).toLocaleString('en-US');}
    }
    rail.forEach(function(l,i){l.addEventListener('click',function(){var rc=sec.getBoundingClientRect(),run=rc.height-window.innerHeight,top=window.scrollY+rc.top;window.scrollTo({top:top+run*(steps[i][0]+.012),behavior:VD3.still?'auto':'smooth'});});});

    var dbs=new T.Vector2(),pink=new T.Color(0xff5ad6);
    function frame(t){
      r.getDrawingBufferSize(dbs);var proj=dbs.y/(2*Math.tan(camera.fov*Math.PI/360));
      gasH.material.uniforms.uS.value=gasC.material.uniforms.uS.value=.014*proj;cMat.uniforms.uS.value=.011*proj;
      prog+=(target-prog)*(VD3.still?1:.085);var p=prog;
      ui(p);camAt(p);
      var idle=VD3.still?0:1;
      camera.position.copy(cp).add(va.set(Math.sin(t*.25)*.05*idle,Math.sin(t*.31)*.025*idle,0));camera.lookAt(ct);

      clip.constant=3-3.02*seg(p,.06,.17);
      var gas=seg(p,.23,.31)*(1-seg(p,.56,.64));
      gasH.material.uniforms.uO.value=gasC.material.uniforms.uO.value=gas;
      gasH.material.uniforms.uT.value=gasC.material.uniforms.uT.value=t;
      var ign=seg(p,.37,.43),off=seg(p,.69,.74),flash=Math.exp(-Math.pow((p-.4)/.012,2))*.6;
      var pl=Math.min(1.3,ign*(1-off)+flash)*(1-.35*seg(p,.5,.6)),flick=1+(VD3.still?0:Math.sin(t*23)*.03+Math.sin(t*7.3)*.04);
      pMat.uniforms.uI.value=pl*flick;pMat.uniforms.uT.value=t;plasma.visible=pl>.002;
      halo.material.opacity=pl*.32*flick;halo.scale.setScalar(1.4+pl*.3);
      pLight.intensity=pl*4*flick;portGlass.emissiveIntensity=pl*1.6*flick;
      if(needle)needle.rotation.z=1.9-3.6*seg(p,.18,.26)+.5*seg(p,.24,.32);
      var grow=seg(p,.47,.68),h=SH0+(SHmax-SH0)*grow;
      cMat.uniforms.uO.value=seg(p,.47,.5)*(1-seg(p,.66,.69));cMat.uniforms.uT.value=t;cMat.uniforms.uH.value=stageTop+h;
      frontMat.opacity=cMat.uniforms.uO.value*.45*(.8+.2*Math.sin(t*6));
      // crystals pick up the plasma's pink while it burns
      seedMat.uniforms.uGlow.value.copy(pink).multiplyScalar(pl*.07);hero.material.uniforms.uGlow.value.copy(pink).multiplyScalar(pl*.07);
      seedMat.uniforms.uRot.value=hero.material.uniforms.uRot.value=t*.1;
      // extraction: the reactor sinks into darkness; one crystal rises into the light
      var ex=seg(p,.7,.79),cut=seg(p,.79,.9),fin=seg(p,.9,.97);
      R.position.y=floor.position.y=-4.2*ss(ex*1.1-.1);
      seeds.forEach(function(s,i){
        var hp=s.userData.home;s.scale.set(1,h,1);s.position.set(hp.x,stageTop+h/2+R.position.y,hp.z);fronts[i].position.y=stageTop+h+.002+R.position.y;
        if(s!==hero){var k=1-ss(ex*1.6);s.scale.multiplyScalar(Math.max(.0001,k));s.visible=k>.01;fronts[i].visible=k>.5;}
      });
      var lift=ss(ex),sc=1+lift*1.25;
      hero.scale.set(sc,h*sc,sc);hero.position.set(0,(stageTop+h/2)*(1-lift)+1.0*lift+R.position.y*(1-lift),0);hero.rotation.y=lift*(VD3.still?.6:t*.35);
      fronts[4].visible=lift<.05;
      room.visible=ex>.02;room.scale.setScalar(40-37.8*ss(ex));
      spot.material.opacity=ss(ex)*.9;
      // cutting
      var rough=1-ss(cut*1.25-.15);hero.material.uniforms.uOpacity.value=rough;hero.visible=rough>.01;
      laser.material.opacity=laserGlow.material.opacity=Math.sin(Math.PI*cl(cut*1.05))*.95;
      var ly=1.0+.2-.4*cut;laser.position.set(0,ly,0);laserGlow.position.set(0,ly,0);laser.lookAt(camera.position.x,ly,camera.position.z);
      var bIn=ss(cut*1.4-.25);bMat.uniforms.uOpacity.value=bIn;brill.visible=bIn>.01;
      bMat.uniforms.uRot.value=t*.22;
      edges.material.opacity=Math.sin(Math.PI*cl(cut*1.2-.1))*.8*(1-fin);
      brill.rotation.y=VD3.still?.4:t*.45;brill.rotation.x=.1*fin;
      r.toneMappingExposure=.9+.12*fin;
      S.composer.render();
    }
    VD3.loop(sec.querySelector('.g-stage'),frame);
    sec.classList.add('ready');
  }
})();
