/* A high-jewellery cuff watch of fancy-colour diamonds, standing on a black marble plinth and turning slowly
   under one spotlight from above. An original, unbranded design: a closed cuff paved edge to edge with large
   mixed-cut stones (round, oval, pear, cushion, emerald, princess) in pink, yellow, blue, cognac and white,
   each held in white-gold claws, around a small pink pavé dial ringed with pink diamonds and blued-steel hands.
   Every stone uses real cut geometry and the shared diamond shader. The hands show the visitor's local time. */
(function(){
  'use strict';
  var cv=document.getElementById('watch');if(!cv)return;
  var stage=cv.parentNode,sec=stage.parentNode;
  function fallback(){sec.classList.add('no-3d');}
  if(!window.VD3){fallback();return;}
  VD3.load().then(build).catch(function(e){console.warn('3D watch unavailable:',e&&e.message);fallback();});

  function build(K){
    var T=K.THREE,V=T.Vector3,mob=VD3.mobile(),still=VD3.still,PI=Math.PI,rnd=VD3.rng(11);
    var S=VD3.setup(K,cv,{fov:26,bloom:.36,bloomRadius:.18,threshold:.97,exposure:.9,clear:0x000000,factors:[1,.55,.2,.06,.02]});
    var scene=S.scene,camera=S.camera,r=S.renderer;
    scene.environmentIntensity=.7;
    scene.fog=new T.Fog(0x000000,8,16);
    r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;

    /* ---------- materials ---------- */
    var gemMat=VD3.crystal(T,VD3.studio(T),{ior:2.42,disp:.03,f0:.17,boost:1.65,scatter:.5});gemMat.transparent=false;gemMat.side=T.DoubleSide;
    var gold=new T.MeshPhysicalMaterial({color:0xdcdcd9,metalness:1,roughness:.1,envMapIntensity:.5,side:T.DoubleSide});   // white gold
    var claw=new T.MeshPhysicalMaterial({color:0xeeedea,metalness:1,roughness:.16});
    var blued=new T.MeshPhysicalMaterial({color:0x2a4fd6,metalness:1,roughness:.2,clearcoat:1,clearcoatRoughness:.08});
    var dialGold=new T.MeshPhysicalMaterial({color:0xf3cfd8,metalness:1,roughness:.24});
    // fancy colours, weighted roughly as they appear across the cuff
    var FANCY=[[0xff9cc6,6],[0xff6aa6,3],[0xffcb45,5],[0xffe08a,3],[0xff9a40,2],[0xd08a4a,1],[0x86aaff,6],[0xb3ccff,4],[0x6283ff,2],[0xffffff,3],[0xd9a2ff,1]];
    var PINKS=[0xff8fbf,0xff74b0,0xffa6cf,0xff5f9e];
    function pick(list){var t=0,i;for(i=0;i<list.length;i++)t+=list[i][1];var x=rnd()*t;for(i=0;i<list.length;i++){x-=list[i][1];if(x<=0)return list[i][0];}return list[0][0];}

    /* ---------- the cuff: an upright oval loop, widest at the dial and narrowing round the back ---------- */
    var A=1,B=.62,TH=.13,DOME=.04;                    // half height, half depth, metal thickness, rise across the band
    function hw(th){return .3+.2*Math.max(0,1-Math.abs(th)/(PI*.44));}   // half width: a tall, tapered hexagon seen from the front
    var NS=1440,TT=new Float32Array(NS+1),SS=new Float32Array(NS+1),i,k;
    for(i=0;i<=NS;i++){TT[i]=-PI+2*PI*i/NS;if(i)SS[i]=SS[i-1]+Math.hypot(A*(Math.sin(TT[i])-Math.sin(TT[i-1])),B*(Math.cos(TT[i])-Math.cos(TT[i-1])));}
    var L=SS[NS],S0=SS[NS/2];                          // loop length; arc length at the dial (theta 0)
    function thetaAt(s){var q=((s+S0)%L+L)%L,lo=0,hi=NS;while(hi-lo>1){var m=(lo+hi)>>1;if(SS[m]<q)lo=m;else hi=m;}var f=(q-SS[lo])/((SS[hi]-SS[lo])||1);return TT[lo]+(TT[hi]-TT[lo])*f;}
    var X=new V(1,0,0);
    function frameAt(th){return {c:new V(0,A*Math.sin(th),B*Math.cos(th)),t:new V(0,A*Math.cos(th),-B*Math.sin(th)).normalize(),n:new V(0,Math.sin(th)/A,Math.cos(th)/B).normalize()};}
    // a point on the outer surface, at arc length s and offset x across the band, with its surface normal and tangent
    function place(s,x,lift){
      var th=thetaAt(s),f=frameAt(th),w=hw(th),u=Math.max(-1,Math.min(1,x/w)),h=DOME*(1-u*u),slope=-2*DOME*u/w;
      return {p:f.c.clone().addScaledVector(X,x).addScaledVector(f.n,h+(lift||0)),n:f.n.clone().addScaledVector(X,-slope).normalize(),t:f.t};
    }

    var watch=new T.Group();scene.add(watch);
    // body: domed outer surface, flat edges and a polished inner wall, each a strip swept round the loop
    function strip(profile){
      var n=360,cols=profile(0).length,pos=[],idx=[];
      for(var j=0;j<=n;j++){var th=-PI+2*PI*j/n,f=frameAt(th),pr=profile(th);
        for(var q=0;q<cols;q++){var p=f.c.clone().addScaledVector(X,pr[q][0]).addScaledVector(f.n,pr[q][1]);pos.push(p.x,p.y,p.z);}}
      for(j=0;j<n;j++)for(q=0;q<cols-1;q++){var a=j*cols+q,b=a+cols;idx.push(a,b,a+1,b,b+1,a+1);}
      var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
      var m=new T.Mesh(g,gold);m.castShadow=true;m.receiveShadow=true;watch.add(m);
    }
    strip(function(th){var w=hw(th),out=[];for(var q=0;q<=16;q++){var u=-1+q/8;out.push([u*w,DOME*(1-u*u)]);}return out;});
    strip(function(th){var w=hw(th);return [[w,0],[w,-TH]];});
    strip(function(th){var w=hw(th);return [[-w,-TH],[-w,0]];});
    strip(function(th){var w=hw(th);return [[w,-TH],[-w,-TH]];});

    /* ---------- stones: packed largest first, in the unrolled band, leaving room for the dial ---------- */
    var DIAL=.124,GAP=.003,stones=[],CELL=.25,NC=Math.ceil(L/CELL),grid=[];for(i=0;i<NC;i++)grid.push([]);
    function cell(s){return Math.floor(((s+L/2)%L+L)%L/CELL)%NC;}
    function free(s,x,rr){
      if(Math.hypot(s,x)<DIAL+rr+GAP)return false;
      for(var c=-1;c<=1;c++){var list=grid[(cell(s)+c+NC)%NC];
        for(var j=0;j<list.length;j++){var o=list[j],ds=Math.abs(s-o.s);ds=Math.min(ds,L-ds);var lim=rr+o.r+GAP;if(ds<lim&&ds*ds+(x-o.x)*(x-o.x)<lim*lim)return false;}}
      return true;
    }
    // dart throwing, largest stones first; each smaller size fills the gaps the larger ones leave
    [.098,.088,.078,.068,.06,.052,.045,.038,.032,.026,.021,.017,.014].forEach(function(t){
      for(var q=0;q<9000;q++){var rr=t*(.9+.2*rnd()),s=(rnd()-.5)*L,w=hw(thetaAt(s))-rr*.6;if(w<=0)continue;var x=(rnd()*2-1)*w;
        if(free(s,x,rr)){var st={s:s,x:x,r:rr};stones.push(st);grid[cell(s)].push(st);}}
    });
    // each shape: the divisor that brings its longest half-length to 1, and where its claws sit on the outline
    var SHAPES={
      round:{k:1,claws:function(n){var o=[];for(var q=0;q<n;q++){var a=(q+.5)/n*2*PI;o.push([Math.cos(a),Math.sin(a)]);}return o;}},
      oval:{k:1.36,claws:function(){return [[.96,.7],[-.96,.7],[.96,-.7],[-.96,-.7],[1.36,0],[-1.36,0]];}},
      pear:{k:1.33,claws:function(){return [[0,1.38],[.83,-.55],[-.83,-.55],[0,-1.28],[.62,.62],[-.62,.62]];}},
      cushion:{k:1.12,claws:function(){return [[.84,.84],[-.84,.84],[.84,-.84],[-.84,-.84]];}},
      princess:{k:1.22,claws:function(){return [[.95,.95],[-.95,.95],[.95,-.95],[-.95,-.95]];}},
      emerald:{k:.74,claws:function(){return [[.66,.45],[-.66,.45],[.66,-.45],[-.66,-.45]];}}
    };
    var BIG=[['round',3],['oval',3],['pear',2.5],['cushion',2.5],['emerald',1.5],['princess',1]],SMALL=[['round',7],['pear',1.5],['oval',1.5]];
    function pickShape(list){var t=0,j;for(j=0;j<list.length;j++)t+=list[j][1];var x=rnd()*t;for(j=0;j<list.length;j++){x-=list[j][1];if(x<=0)return list[j][0];}return 'round';}

    var gems={},clawPts=[],M=new T.Matrix4(),col=new T.Color();
    function addGem(shape,p,n,t,phi,size,hex){
      var sh=SHAPES[shape],sc=size/sh.k,b=new V().crossVectors(n,t).normalize(),ex=t.clone().multiplyScalar(Math.cos(phi)).addScaledVector(b,Math.sin(phi)),ez=new V().crossVectors(ex,n);
      (gems[shape]=gems[shape]||[]).push({m:new T.Matrix4().makeBasis(ex,n,ez).scale(new V(sc,sc,sc)).setPosition(p),c:hex});
      return {ex:ex,ez:ez,sc:sc,sh:sh};
    }
    stones.forEach(function(st){
      var shape=pickShape(st.r>.045?BIG:SMALL),pl=place(st.s,st.x,.012),g=addGem(shape,pl.p,pl.n,pl.t,rnd()*2*PI,st.r*1.04,pick(FANCY));
      g.sh.claws(st.r>.05?6:4).forEach(function(c){clawPts.push({p:pl.p.clone().addScaledVector(g.ex,c[0]*g.sc*1.01).addScaledVector(g.ez,c[1]*g.sc*1.01).addScaledVector(pl.n,.05*g.sc),ex:g.ex,n:pl.n,ez:g.ez,s:Math.max(.0035,st.r*.11)});});
    });

    /* ---------- the dial: pink pavé inside a halo of pink diamonds, blued hands ---------- */
    var front=place(0,0,0),dz=front.p.z,FN=new V(0,0,1),FT=new V(1,0,0);
    var plate=new T.Mesh(new T.CylinderGeometry(DIAL,DIAL+.006,.05,96),gold);plate.rotation.x=PI/2;plate.position.z=dz;plate.castShadow=true;watch.add(plate);
    var face=new T.Mesh(new T.CircleGeometry(.08,64),dialGold);face.position.z=dz+.026;watch.add(face);
    [[DIAL-.006,.0065],[.081,.0045]].forEach(function(b){var ring=new T.Mesh(new T.TorusGeometry(b[0],b[1],14,128),gold);ring.position.z=dz+.026;watch.add(ring);});
    for(i=0;i<20;i++){var a=i/20*2*PI,hp=new V(Math.cos(a)*.1,Math.sin(a)*.1,dz+.03);addGem('round',hp,FN,FT,a,.0168,PINKS[i%PINKS.length]);
      var a2=a+PI/20;clawPts.push({p:new V(Math.cos(a2)*.1,Math.sin(a2)*.1,dz+.033),ex:FT,n:FN,ez:new V(0,-1,0),s:.0042});}
    var gp=.0186;
    for(var row=-5;row<=5;row++)for(var c2=-5;c2<=5;c2++){var px=(c2+(row&1)*.5)*gp,py=row*gp*.866,rad=Math.hypot(px,py);
      if(rad<.012||rad>.071)continue;addGem('round',new V(px,py,dz+.03),FN,FT,rnd()*PI,.0084,PINKS[(row*7+c2*3+50)%PINKS.length]);}
    function handGeo(len,w,tail){var s=new T.Shape();s.moveTo(0,-tail);s.lineTo(w/2,0);s.lineTo(w*.15,len);s.lineTo(-w*.15,len);s.lineTo(-w/2,0);s.closePath();
      var g=new T.ExtrudeGeometry(s,{depth:.0015,bevelEnabled:true,bevelThickness:.0012,bevelSize:.0012,bevelSegments:1});return g;}
    function hand(len,w,z){var piv=new T.Group();piv.position.z=dz+z;watch.add(piv);var m=new T.Mesh(handGeo(len,w,.008),blued);m.castShadow=true;piv.add(m);return piv;}
    var hH=hand(.048,.011,.042),hM=hand(.068,.008,.046);
    var cap=new T.Mesh(new T.CylinderGeometry(.006,.007,.006,24),blued);cap.rotation.x=PI/2;cap.position.z=dz+.05;watch.add(cap);

    /* ---------- one instanced draw per cut, one for every claw ---------- */
    var rot=new T.Matrix4();
    Object.keys(gems).forEach(function(shape){
      var list=gems[shape],geo=VD3.cutGeometry(T,shape),mesh=new T.InstancedMesh(geo,gemMat,list.length);
      list.forEach(function(g,j){mesh.setMatrixAt(j,g.m);mesh.setColorAt(j,col.set(g.c));});
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();watch.add(mesh);
    });
    var clawGeo=new T.SphereGeometry(1,10,8),claws=new T.InstancedMesh(clawGeo,claw,clawPts.length);
    clawPts.forEach(function(c,j){rot.makeBasis(c.ex,c.n,c.ez).scale(new V(c.s,c.s*1.5,c.s)).setPosition(c.p);claws.setMatrixAt(j,rot);});
    claws.computeBoundingSphere();watch.add(claws);

    // stand the cuff on its lowest stones
    var minY=Infinity;stones.forEach(function(st){var p=place(st.s,st.x,0).p;minY=Math.min(minY,p.y-st.r*.9);});
    var top=-1.08;watch.position.y=top-minY;

    /* ---------- black marble plinth ---------- */
    var marble=(function(){
      var s=1024,c=document.createElement('canvas');c.width=c.height=s;var x=c.getContext('2d'),mr=VD3.rng(5);
      x.fillStyle='#0b0b0c';x.fillRect(0,0,s,s);
      for(var q=0;q<70;q++){var gx=mr()*s,gy=mr()*s,gr=60+mr()*220,g=x.createRadialGradient(gx,gy,0,gx,gy,gr);g.addColorStop(0,'rgba(44,44,48,'+(.12+mr()*.2)+')');g.addColorStop(1,'rgba(44,44,48,0)');x.fillStyle=g;x.fillRect(0,0,s,s);}
      function vein(px,py,ang,steps,w,al){x.beginPath();x.moveTo(px,py);for(var j=0;j<steps;j++){ang+=(mr()-.5)*.55;px+=Math.cos(ang)*7;py+=Math.sin(ang)*7;x.lineTo(px,py);
          if(w>1.1&&mr()<.025)vein(px,py,ang+(mr()-.5)*2.2,40+mr()*80,w*.5,al*.8);}
        x.strokeStyle='rgba(222,222,228,'+al+')';x.lineWidth=w;x.lineJoin='round';x.stroke();}
      for(q=0;q<9;q++){var vx=mr()*s,vy=mr()*s,va=.5+mr()*.6;vein(vx,vy,va,140+mr()*120,.8+mr()*2.4,.22+mr()*.4);vein(vx,vy,va+PI,80+mr()*80,.6+mr()*1.6,.18+mr()*.3);}
      for(q=0;q<40;q++)vein(mr()*s,mr()*s,mr()*2*PI,20+mr()*40,.5,.12+mr()*.15);
      var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=r.capabilities.getMaxAnisotropy();return t;
    })();
    var sideTex=marble.clone();sideTex.wrapS=T.RepeatWrapping;sideTex.repeat.set(3,.18);sideTex.needsUpdate=true;
    var PH=.22,plinth=new T.Mesh(new T.CylinderGeometry(1.25,1.25,PH,128),[
      new T.MeshPhysicalMaterial({map:sideTex,roughness:.3,clearcoat:.6,clearcoatRoughness:.12,envMapIntensity:.4}),
      new T.MeshPhysicalMaterial({map:marble,roughness:.2,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:.22}),
      new T.MeshStandardMaterial({color:0x050505})]);
    plinth.position.y=top-PH/2;plinth.receiveShadow=true;plinth.castShadow=true;scene.add(plinth);

    /* ---------- one spotlight from above ---------- */
    var spot=new T.SpotLight(0xfff5e8,7,14,.32,.6,1.3);spot.position.set(0,4.6,1);spot.target.position.set(0,-.4,0);
    spot.castShadow=true;spot.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);spot.shadow.bias=-.0004;spot.shadow.normalBias=.01;scene.add(spot,spot.target);
    var rim=new T.DirectionalLight(0xc8d2ff,.35);rim.position.set(-3,1,-2);scene.add(rim);
    var fill=new T.DirectionalLight(0xfff4ea,.25);fill.position.set(1.5,1,4);scene.add(fill);
    var floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x050506,metalness:.2,roughness:.8,envMapIntensity:0}));floor.rotation.x=-PI/2;floor.position.y=top-PH;floor.receiveShadow=true;scene.add(floor);
    var beam=new T.Mesh(new T.CylinderGeometry(.08,1.5,5.6,64,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,side:T.DoubleSide,
      uniforms:{uO:{value:mob?.04:.05}},
      vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform float uO;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=pow(abs(dot(vN,vV)),2.2);float a=uO*f*smoothstep(.12,1.,vUv.y)*(.3+.7*vUv.y);gl_FragColor=vec4(vec3(1.,.95,.86)*a,a);}'}));
    beam.position.set(0,top+2.8,.1);beam.rotation.x=-.05;scene.add(beam);
    var ND=mob?100:200,dGeo=new T.BufferGeometry(),dR=new Float32Array(ND*4);
    for(i=0;i<ND;i++){dR[i*4]=rnd();dR[i*4+1]=rnd();dR[i*4+2]=rnd();dR[i*4+3]=rnd();}
    dGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(ND*3),3));dGeo.setAttribute('aR',new T.BufferAttribute(dR,4));
    var dMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uT:{value:0},uS:{value:1}},
      vertexShader:'attribute vec4 aR;uniform float uT,uS;varying float vA;void main(){float y=4.-mod(aR.y*5.5+uT*.05,5.5);float w=.1+(4.-y)*.27;float a=aR.x*6.283+uT*.04*(aR.z-.5);vec3 p=vec3(cos(a)*w*sqrt(aR.z),y,sin(a)*w*sqrt(aR.z)+.1);vA=(.2+.8*aR.w)*smoothstep(-1.4,-.7,y)*(.5+.5*sin(uT*.7+aR.w*20.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uS*(.5+aR.w)/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*.4;gl_FragColor=vec4(vec3(1.,.93,.82)*a,a);}'});
    var dust=new T.Points(dGeo,dMat);dust.frustumCulled=false;scene.add(dust);

    /* ---------- framing + motion: a slow turntable ---------- */
    var fitA=0,bottom=top-PH,height=A+.12-bottom;
    function fit(){var a=camera.aspect,k=2*Math.tan(camera.fov*PI/360),d=Math.max((height+.3)/k,2.85/k/a),cy=bottom+height/2;camera.position.set(0,cy+d*.15,d);camera.lookAt(0,cy-.04,0);fitA=a;}
    var ptr={x:0,y:0,tx:0,ty:0};
    if(window.matchMedia('(pointer: fine)').matches){
      stage.addEventListener('pointermove',function(e){var b=stage.getBoundingClientRect();ptr.tx=(e.clientX-b.left)/b.width-.5;ptr.ty=(e.clientY-b.top)/b.height-.5;});
      stage.addEventListener('pointerleave',function(){ptr.tx=ptr.ty=0;});
    }
    var dbs=new T.Vector2(),spin=-.45,last=0;
    VD3.loop(cv,function(t){
      if(camera.aspect!==fitA)fit();
      var dt=last?Math.min(.05,t-last):0;last=t;spin+=still?0:dt*.2;            // about one turn every 30 seconds
      ptr.x+=(ptr.tx-ptr.x)*.05;ptr.y+=(ptr.ty-ptr.y)*.05;
      watch.rotation.set(ptr.y*.08,(still?-.3:spin)+ptr.x*.4,0);
      gemMat.uniforms.uRot.value=still?.5:t*.06;
      var d=new Date(),sc=d.getSeconds()+d.getMilliseconds()/1000,mn=d.getMinutes()+sc/60,hr=(d.getHours()%12)+mn/60;
      hM.rotation.z=-mn/60*2*PI;hH.rotation.z=-hr/12*2*PI;
      r.getDrawingBufferSize(dbs);dMat.uniforms.uS.value=.02*dbs.y/(2*Math.tan(camera.fov*PI/360));dMat.uniforms.uT.value=still?0:t;
      S.composer.render();
    },S);
    cv.dataset.mode='3d';
  }
})();
