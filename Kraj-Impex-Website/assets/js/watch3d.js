/* A diamond-set sports watch in platinum and white gold, turning slowly under one spotlight from above.
   An original design (rounded-octagon case, integrated bracelet); no maker's name or logo.
   Built to watchmaking proportions (1 unit ≈ 40 mm): brushed and polished surfaces, three rows of bezel stones,
   a fully set dial with applied batons, faceted hands under a sapphire crystal, and every diamond in its own setting.
   The hands show the visitor's local time. */
(function(){
  'use strict';
  var cv=document.getElementById('watch');if(!cv)return;
  var stage=cv.parentNode,sec=stage.parentNode;
  function fallback(){sec.classList.add('no-3d');}
  if(!window.VD3){fallback();return;}
  VD3.load().then(build).catch(function(e){console.warn('3D watch unavailable:',e&&e.message);fallback();});

  function build(K){
    var T=K.THREE,V=T.Vector3,mob=VD3.mobile(),still=VD3.still,PI=Math.PI;
    var S=VD3.setup(K,cv,{fov:26,bloom:.32,bloomRadius:.15,threshold:.98,exposure:.82,clear:0x000000,factors:[1,.55,.2,.06,.02]});
    var scene=S.scene,camera=S.camera,r=S.renderer;
    scene.environmentIntensity=.6;
    scene.fog=new T.Fog(0x000000,7,13);
    r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;

    /* ---------- materials ---------- */
    var studio=VD3.studio(T);
    var gemMat=VD3.crystal(T,studio,{ior:2.42,disp:.03,f0:.17,boost:.92});gemMat.transparent=false;
    function metal(color,rough,aniso){var m=new T.MeshPhysicalMaterial({color:color,metalness:1,roughness:rough});if(aniso){m.anisotropy=aniso;}return m;}
    var plat=metal(0xd2cfca,.1),platBrushed=metal(0xc9c6c0,.3,.85);
    var wg=metal(0xe1e3e7,.11),wgBrushed=metal(0xd8dade,.3,.8),seat=metal(0xdfe1e5,.22);
    var handMat=metal(0x26282e,.16),dialMat=metal(0xbfc2c8,.35);
    var sapphire=new T.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:0,transparent:true,opacity:.06,envMapIntensity:.5,depthWrite:false});

    /* ---------- profile helpers ---------- */
    function roct(R,rc){var s=new T.Shape(),d=(R-rc)/Math.cos(PI/8);for(var i=0;i<8;i++){var a=PI/8+i*PI/4;s.absarc(Math.cos(a)*d,Math.sin(a)*d,rc,a-PI/8,a+PI/8,false);}return s;}
    function inside(pts,x,y){var c=false;for(var i=0,j=pts.length-1;i<pts.length;j=i++){var a=pts[i],b=pts[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))c=!c;}return c;}
    function rrect(w,h,rc){var s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+rc,y);s.lineTo(x+w-rc,y);s.quadraticCurveTo(x+w,y,x+w,y+rc);s.lineTo(x+w,y+h-rc);s.quadraticCurveTo(x+w,y+h,x+w-rc,y+h);s.lineTo(x+rc,y+h);s.quadraticCurveTo(x,y+h,x,y+h-rc);s.lineTo(x,y+rc);s.quadraticCurveTo(x,y,x+rc,y);return s;}
    function ext(shape,depth,bevel,seg){var g=new T.ExtrudeGeometry(shape,{depth:depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel*.9,bevelSegments:seg||5,curveSegments:18});g.translate(0,0,-depth/2);return g;}

    var watch=new T.Group();scene.add(watch);
    var gems=[];
    function mesh(geo,mat,parent){var m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;(parent||watch).add(m);return m;}
    function stone(p,n,rad){gems.push({p:p,n:n,s:rad});}

    /* ---------- case ---------- */
    mesh(ext(roct(.5,.13),.15,.022),platBrushed);                                  // middle case, brushed flanks
    var back=mesh(ext(roct(.455,.12),.03,.01),plat);back.position.z=-.098;           // polished case back
    var ring=new T.Shape();roct(.49,.125).getPoints(24).forEach(function(p,i){i?ring.lineTo(p.x,p.y):ring.moveTo(p.x,p.y);});
    ring.holes.push(new T.Path(roct(.372,.07).getPoints(24).reverse()));
    var bez=mesh(ext(ring,.03,.012,6),plat);bez.position.z=.125;                       // polished bezel
    // three rows of bezel stones, each row following the bezel's outline
    [.389,.419,.449].forEach(function(R){
      var rc=.07+(R-.372)/(.49-.372)*.055,per=0,pts=roct(R,rc).getSpacedPoints(400);
      for(var i=1;i<pts.length;i++)per+=pts[i].distanceTo(pts[i-1]);
      var n=Math.floor(per/.0305),sp=roct(R,rc).getSpacedPoints(n);sp.pop();
      sp.forEach(function(p){stone(new V(p.x,p.y,.152),new V(0,0,1),.0135);});
    });
    // dial: a fully set field inside the bezel
    var dial=mesh(new T.ShapeGeometry(roct(.373,.07),18),dialMat);dial.position.z=.102;
    var dp=roct(.358,.06).getPoints(12),g=mob?.034:.0262;
    for(var y=-.36,row=0;y<.36;y+=g*.866,row++)for(var x=-.36+(row%2?g/2:0);x<.36;x+=g){
      if(Math.hypot(x,y)<.028||!inside(dp,x,y))continue;stone(new V(x,y,.106),new V(0,0,1),g*.44);
    }
    // applied hour batons in polished white gold (double at twelve)
    var baton=ext(rrect(.02,.068,.004),.012,.004,3);
    for(var h=0;h<12;h++){var a=h/12*2*PI;
      (h===0?[-.016,.016]:[0]).forEach(function(o){var m=mesh(baton,wg);var rr=.292;m.position.set(Math.sin(a)*rr+Math.cos(a)*o,Math.cos(a)*rr-Math.sin(a)*o,.122);m.rotation.z=-a;});}
    // faceted dauphine hands, seconds hand, centre cap
    function handGeo(len,w,tail){var s=new T.Shape();s.moveTo(0,-tail);s.lineTo(w/2,0);s.lineTo(w*.12,len);s.lineTo(-w*.12,len);s.lineTo(-w/2,0);s.closePath();return ext(s,.004,.0045,1);}
    function hand(geo,mat,z){var piv=new T.Group();piv.position.z=z;watch.add(piv);mesh(geo,mat,piv);return piv;}
    var hH=hand(handGeo(.2,.034,.03),handMat,.132),hM=hand(handGeo(.3,.026,.03),handMat,.14);
    var sGeo=new T.BoxGeometry(.005,.37,.003);sGeo.translate(0,.12,0);var hS=hand(sGeo,wg,.147);
    var cap=mesh(new T.CylinderGeometry(.016,.018,.012,32),wg);cap.rotation.x=PI/2;cap.position.z=.15;
    var crystal=mesh(new T.ShapeGeometry(roct(.374,.07),18),sapphire);crystal.position.z=.156;crystal.castShadow=false;
    // knurled crown with a diamond on its end, and crown guards
    var crown=mesh(new T.CylinderGeometry(.052,.052,.07,30),new T.MeshPhysicalMaterial({color:0xd2cfca,metalness:1,roughness:.18,flatShading:true}));crown.rotation.z=PI/2;crown.position.set(.55,0,0);
    stone(new V(.588,0,0),new V(1,0,0),.026);
    [-1,1].forEach(function(k){var m=mesh(ext(rrect(.05,.03,.012),.1,.008,3),plat);m.position.set(.515,k*.078,0);});

    /* ---------- integrated bracelet: three-piece links, every link set ---------- */
    var L=.15,Rb=.95,rows=9,linkCache={};
    function linkGeom(w){var k=w.toFixed(3);return linkCache[k]||(linkCache[k]=ext(rrect(w,L-.014,.018),.045,.011,4));}
    var lg=mob?.042:.034;
    function setLink(row,w,cx){
      var cols=Math.max(1,Math.floor((w-.026)/lg)+1),rws=Math.max(1,Math.floor((L-.04)/lg)+1);
      for(var i=0;i<cols;i++)for(var j=0;j<rws;j++){var lp=new V(cx+(i-(cols-1)/2)*lg,(j-(rws-1)/2)*lg,.035);
        stone(lp.applyMatrix4(row.matrix),new V(0,0,1).applyQuaternion(row.quaternion),lg*.43);}
    }
    [1,-1].forEach(function(sg){
      for(var k=0;k<rows;k++){
        var s=(k+.5)*L,th=s/Rb,row=new T.Group();
        row.position.set(0,sg*(.5+Rb*Math.sin(th)),-Rb*(1-Math.cos(th)));row.rotation.x=-sg*th;watch.add(row);row.updateMatrix();
        var w=.6-.013*k,cw=w*.46,sw=(w-cw-.024)/2;
        mesh(linkGeom(cw),wg,row);setLink(row,cw,0);
        [-1,1].forEach(function(e){var cx=e*(cw/2+.012+sw/2),m=mesh(linkGeom(sw),wgBrushed,row);m.position.x=cx;setLink(row,sw,cx);});
      }
    });

    /* ---------- the stones and their settings, each in one draw ---------- */
    var prof=[new T.Vector2(.001,-.6),new T.Vector2(.5,-.32),new T.Vector2(1,-.02),new T.Vector2(1,.04),new T.Vector2(.78,.18),new T.Vector2(.55,.3),new T.Vector2(.001,.3)];
    var gGeo=new T.LatheGeometry(prof,12);gGeo.rotateX(PI/2);
    var seatGeo=new T.TorusGeometry(1,.13,4,16);
    var inst=new T.InstancedMesh(gGeo,gemMat,gems.length),cups=new T.InstancedMesh(seatGeo,seat,gems.length);
    var M=new T.Matrix4(),Q=new T.Quaternion(),Qs=new T.Quaternion(),Z=new V(0,0,1),rnd=VD3.rng(9),pos=new V();
    gems.forEach(function(gm,i){
      Q.setFromUnitVectors(Z,gm.n);Qs.setFromAxisAngle(Z,rnd()*6.283);Q.multiply(Qs);
      pos.copy(gm.p).addScaledVector(gm.n,gm.s*.18);
      M.compose(pos,Q,new V(gm.s,gm.s,gm.s));inst.setMatrixAt(i,M);
      M.compose(pos,Q,new V(gm.s*1.07,gm.s*1.07,gm.s*1.07));cups.setMatrixAt(i,M);
    });
    watch.add(inst,cups);                                   // settings cast no shadow: too small to see, costly to draw

    /* ---------- one spotlight from above ---------- */
    var spot=new T.SpotLight(0xfff5e8,10,14,.28,.65,1.3);spot.position.set(0,4.4,.8);spot.target.position.set(0,-.2,-.2);
    spot.castShadow=true;spot.shadow.mapSize.set(mob?512:1024,mob?512:1024);spot.shadow.bias=-.0005;spot.shadow.radius=5;scene.add(spot,spot.target);
    var rim=new T.DirectionalLight(0xc8d2ff,.35);rim.position.set(-3,1,-2);scene.add(rim);
    var floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x050506,metalness:.2,roughness:.8,envMapIntensity:0}));floor.rotation.x=-PI/2;floor.position.y=-1.52;floor.receiveShadow=true;scene.add(floor);
    var beam=new T.Mesh(new T.CylinderGeometry(.08,.95,5.6,64,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,side:T.DoubleSide,
      uniforms:{uO:{value:mob?.045:.055}},
      vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform float uO;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=pow(abs(dot(vN,vV)),2.2);float a=uO*f*smoothstep(.12,1.,vUv.y)*(.3+.7*vUv.y);gl_FragColor=vec4(vec3(1.,.95,.86)*a,a);}'}));
    beam.position.set(0,1.6,.25);beam.rotation.x=-.12;scene.add(beam);
    var ND=mob?100:200,dGeo=new T.BufferGeometry(),dR=new Float32Array(ND*4);
    for(var i=0;i<ND;i++){dR[i*4]=rnd();dR[i*4+1]=rnd();dR[i*4+2]=rnd();dR[i*4+3]=rnd();}
    dGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(ND*3),3));dGeo.setAttribute('aR',new T.BufferAttribute(dR,4));
    var dMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uT:{value:0},uS:{value:1}},
      vertexShader:'attribute vec4 aR;uniform float uT,uS;varying float vA;void main(){float y=4.-mod(aR.y*5.5+uT*.05,5.5);float w=.1+(4.-y)*.17;float a=aR.x*6.283+uT*.04*(aR.z-.5);vec3 p=vec3(cos(a)*w*sqrt(aR.z),y,sin(a)*w*sqrt(aR.z)+.25);vA=(.2+.8*aR.w)*smoothstep(-1.5,-.8,y)*(.5+.5*sin(uT*.7+aR.w*20.));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uS*(.5+aR.w)/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*.4;gl_FragColor=vec4(vec3(1.,.93,.82)*a,a);}'});
    var dust=new T.Points(dGeo,dMat);dust.frustumCulled=false;scene.add(dust);

    /* ---------- framing + motion: a slow, continuous turn ---------- */
    var fitA=0;
    function fit(){var a=camera.aspect,k=2*Math.tan(camera.fov*PI/360),h=3.45/k,w=1.9/k/a,d=Math.max(h,w);camera.position.set(0,.5,d);camera.lookAt(0,-.1,-.3);fitA=a;}
    var ptr={x:0,y:0,tx:0,ty:0};
    if(window.matchMedia('(pointer: fine)').matches){
      stage.addEventListener('pointermove',function(e){var b=stage.getBoundingClientRect();ptr.tx=(e.clientX-b.left)/b.width-.5;ptr.ty=(e.clientY-b.top)/b.height-.5;});
      stage.addEventListener('pointerleave',function(){ptr.tx=ptr.ty=0;});
    }
    var dbs=new T.Vector2(),spin=0,last=0;
    VD3.loop(cv,function(t){
      if(camera.aspect!==fitA)fit();
      var dt=last?Math.min(.05,t-last):0;last=t;spin+=still?0:dt*.22;           // about one turn every 28 seconds
      ptr.x+=(ptr.tx-ptr.x)*.05;ptr.y+=(ptr.ty-ptr.y)*.05;
      watch.rotation.set(-.07+ptr.y*.14,(still?.4:spin)+ptr.x*.35,0);
      watch.position.y=still?0:Math.sin(t*.5)*.015;
      gemMat.uniforms.uRot.value=still?.5:t*.06;
      var d=new Date(),sc=d.getSeconds()+d.getMilliseconds()/1000,mn=d.getMinutes()+sc/60,hr=(d.getHours()%12)+mn/60;
      hS.rotation.z=-sc/60*2*PI;hM.rotation.z=-mn/60*2*PI;hH.rotation.z=-hr/12*2*PI;
      r.getDrawingBufferSize(dbs);dMat.uniforms.uS.value=.02*dbs.y/(2*Math.tan(camera.fov*PI/360));dMat.uniforms.uT.value=still?0:t;
      S.composer.render();
    },S);
    cv.dataset.mode='3d';
  }
})();
