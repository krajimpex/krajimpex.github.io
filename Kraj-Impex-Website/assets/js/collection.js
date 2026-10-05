/* Collections: two rooms (natural / laboratory-grown), each opening a small set of sample stones.
   Every stone is drawn from real cut geometry (a 57-facet round brilliant and its fancy variants, and an
   emerald step cut) with the shared diamond shader, shown the way listings are photographed: on white,
   turning slowly. One WebGL renderer draws all the cards; a second drives the 360° viewer in the dialog.
   The listings are illustrative; edit STONES below to list real stones and their report numbers. */
(function(){
  'use strict';

  /* ---------- the sample stones ---------- */
  var STONES={
    natural:[
      {id:'KI-N-0302',shape:'round',name:'Round Brilliant',ct:'3.02',color:'E',clarity:'VVS1',cut:'Excellent',polish:'Excellent',sym:'Excellent',fl:'None',mm:'9.31 – 9.35 × 5.76',depth:'61.7',table:'57',lab:'GIA'},
      {id:'KI-N-0215',shape:'oval',name:'Oval',ct:'2.15',color:'F',clarity:'VS1',cut:'—',polish:'Excellent',sym:'Very Good',fl:'Faint',mm:'10.48 × 7.12 × 4.39',depth:'61.6',table:'58',lab:'GIA'},
      {id:'KI-N-0401',shape:'emerald',name:'Emerald Cut',ct:'4.01',color:'D',clarity:'IF',cut:'—',polish:'Excellent',sym:'Excellent',fl:'None',mm:'11.02 × 7.89 × 5.12',depth:'64.9',table:'63',lab:'GIA'},
      {id:'KI-N-0171',shape:'pear',name:'Pear',ct:'1.71',color:'G',clarity:'VVS2',cut:'—',polish:'Excellent',sym:'Very Good',fl:'None',mm:'11.20 × 6.95 × 4.21',depth:'60.6',table:'59',lab:'GIA'},
      {id:'KI-N-0251',shape:'cushion',name:'Cushion Brilliant',ct:'2.51',color:'E',clarity:'VS2',cut:'—',polish:'Excellent',sym:'Excellent',fl:'None',mm:'8.42 × 7.96 × 5.21',depth:'65.5',table:'60',lab:'GIA'}
    ],
    lab:[
      {id:'KI-L-0204',shape:'round',name:'Round Brilliant',ct:'2.04',color:'D',clarity:'VVS2',cut:'Ideal',polish:'Excellent',sym:'Excellent',fl:'None',mm:'8.18 – 8.21 × 5.05',depth:'61.6',table:'56',lab:'IGI',growth:'CVD, as grown'},
      {id:'KI-L-0312',shape:'oval',name:'Oval',ct:'3.12',color:'E',clarity:'VS1',cut:'—',polish:'Excellent',sym:'Excellent',fl:'None',mm:'11.62 × 7.95 × 4.91',depth:'61.8',table:'59',lab:'IGI',growth:'CVD, as grown'},
      {id:'KI-L-0503',shape:'emerald',name:'Emerald Cut',ct:'5.03',color:'F',clarity:'VVS1',cut:'—',polish:'Excellent',sym:'Excellent',fl:'None',mm:'11.94 × 8.51 × 5.58',depth:'65.6',table:'64',lab:'IGI',growth:'CVD'},
      {id:'KI-L-0152',shape:'princess',name:'Princess',ct:'1.52',color:'G',clarity:'VS1',cut:'—',polish:'Excellent',sym:'Very Good',fl:'None',mm:'6.21 × 6.18 × 4.47',depth:'72.3',table:'68',lab:'IGI',growth:'CVD, as grown'},
      {id:'KI-L-0220',shape:'cushion',name:'Cushion Brilliant',ct:'2.20',color:'E',clarity:'VVS2',cut:'—',polish:'Excellent',sym:'Excellent',fl:'None',mm:'7.96 × 7.62 × 5.04',depth:'66.1',table:'61',lab:'IGI',growth:'CVD'}
    ]
  };
  var TINT={D:0xffffff,E:0xffffff,F:0xfffefb,G:0xfffcf3,H:0xfff9ea};

  /* ---------- rooms open their collection ---------- */
  var panels={natural:document.getElementById('natural'),lab:document.getElementById('lab-grown')};
  function open(key,scroll){
    Object.keys(panels).forEach(function(k){if(panels[k])panels[k].hidden=k!==key;});
    document.querySelectorAll('[data-room]').forEach(function(a){a.setAttribute('aria-expanded',a.dataset.room===key);});
    if(scroll&&panels[key])panels[key].scrollIntoView({behavior:window.VD3&&VD3.still?'auto':'smooth',block:'start'});
    if(window.__collectionShown)window.__collectionShown();
  }
  function fromHash(scroll){var h=location.hash.slice(1);if(h==='natural')open('natural',scroll);else if(h==='lab-grown')open('lab',scroll);}
  document.querySelectorAll('[data-room]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var k=a.dataset.room;history.replaceState(null,'','#'+(k==='lab'?'lab-grown':'natural'));open(k,true);});});
  window.addEventListener('hashchange',function(){fromHash(true);});

  /* ---------- cards ---------- */
  function spec(s){return s.color+' · '+s.clarity+(s.cut!=='—'?' · '+s.cut:'');}
  Object.keys(STONES).forEach(function(k){
    var grid=panels[k==='lab'?'lab':'natural']&&panels[k==='lab'?'lab':'natural'].querySelector('.stones');if(!grid)return;
    STONES[k].forEach(function(s){
      var b=document.createElement('button');b.type='button';b.className='stone';b.dataset.id=s.id;
      b.setAttribute('aria-label',s.ct+' carat '+s.name+', '+spec(s)+', '+s.lab+(k==='lab'?', laboratory-grown':', natural')+'. Coming soon. View details');
      b.innerHTML='<span class="stone-img"><canvas aria-hidden="true"></canvas><span class="sample">Coming soon</span></span>'+
        '<span class="stone-meta"><span class="stone-name">'+s.ct+' ct '+s.name+'</span><span class="stone-spec">'+spec(s)+'</span>'+
        '<span class="stone-lab">'+s.lab+' report · '+(k==='lab'?'Laboratory-grown':'Natural')+'</span></span>';
      b.addEventListener('click',function(){showStone(s,k);});
      grid.appendChild(b);s.card=b;s.kind=k;
    });
  });
  fromHash(false);

  if(!window.VD3){document.documentElement.classList.add('no-gl');return;}
  VD3.load().then(build).catch(function(e){console.warn('3D stones unavailable:',e&&e.message);document.documentElement.classList.add('no-gl');});

  var dialogShow=null;
  function showStone(s,k){if(dialogShow)dialogShow(s,k);else openDialog(s,k,null);}

  /* ---------- dialog (works without WebGL too; the 3D view is added when available) ---------- */
  var dlg=document.getElementById('stoneDialog');
  function openDialog(s,k,after){
    if(!dlg)return;
    dlg.querySelector('[data-f=title]').textContent=s.ct+' ct '+s.name;
    dlg.querySelector('[data-f=kind]').textContent=k==='lab'?'Laboratory-grown diamond':'Natural diamond';
    var rows=[['Shape',s.name],['Carat weight',s.ct],['Colour',s.color],['Clarity',s.clarity],['Cut',s.cut],['Polish',s.polish],['Symmetry',s.sym],['Fluorescence',s.fl],['Measurements',s.mm+' mm'],['Depth',s.depth+'%'],['Table',s.table+'%']];
    if(s.growth)rows.push(['Growth',s.growth]);
    rows.push(['Report',s.lab+' (illustrative)'],['Reference',s.id],['Availability','Coming soon'],['Price','In private']);
    dlg.querySelector('dl').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>';}).join('');
    dlg.querySelector('[data-f=ask]').href='introduction.html?stone='+encodeURIComponent(s.id+' · '+s.ct+' ct '+s.name+', '+s.color+' '+s.clarity)+'#private';
    if(!dlg.open)dlg.showModal();
    if(after)after();
  }
  if(dlg){
    dlg.querySelector('[data-f=close]').addEventListener('click',function(){dlg.close();});dlg.querySelector('[data-f=x]').addEventListener('click',function(){dlg.close();});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
  }

  function geometry(T,shape){return VD3.cutGeometry(T,shape);}

  /* ---------- rendering ---------- */
  function build(K){
    var T=K.THREE,still=VD3.still,mob=VD3.mobile();
    // a jeweller's light box: bright softboxes and strips against black, so facets read crisp black and white
    var studio=(function(){
      var c=document.createElement('canvas');c.width=2048;c.height=1024;var x=c.getContext('2d'),rnd=VD3.rng(41);
      var bg=x.createLinearGradient(0,0,0,1024);bg.addColorStop(0,'#f2f2f4');bg.addColorStop(.35,'#a9abb0');bg.addColorStop(.5,'#2a2b2e');bg.addColorStop(.62,'#9c9ea3');bg.addColorStop(1,'#e4e5e8');
      x.fillStyle=bg;x.fillRect(0,0,2048,1024);
      function box(u,v,w,h,col){x.fillStyle=col;x.fillRect(u*2048,v*1024,w*2048,h*1024);}
      box(.3,.0,.4,.12,'#ffffff');box(0,.0,1,.04,'#f4f4f6');
      for(var i=0;i<26;i++)box(i/26+rnd()*.01,.06,.006+rnd()*.01,.88,rnd()<.42?'#000':'#f2f2f4');
      for(i=0;i<70;i++){var w=.01+rnd()*.05,h=.02+rnd()*.12;box(rnd(),.08+rnd()*.84,w,h,rnd()<.64?'#ffffff':'#000000');}
      for(i=0;i<120;i++){var s=.002+rnd()*.006;box(rnd(),.05+rnd()*.85,s,s*2,'#ffffff');}
      box(.12,.62,.08,.05,'#fff2d6');box(.58,.66,.07,.04,'#dce8ff');
      var tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.generateMipmaps=false;tx.minFilter=T.LinearFilter;tx.wrapS=T.RepeatWrapping;return tx;
    })(),geos={},mats={};
    function geo(shape){return geos[shape]||(geos[shape]=geometry(T,shape));}
    function mat(color){if(!mats[color]){var m=VD3.crystal(T,studio,{ior:2.42,disp:.05,f0:.17,boost:1.45,scatter:1,tint:TINT[color]||0xffffff});m.transparent=false;m.side=T.DoubleSide;mats[color]=m;}return mats[color];}
    function stage(){var sc=new T.Scene(),cam=new T.PerspectiveCamera(24,1,.1,50),mesh=new T.Mesh(geo('round'),mat('E'));sc.add(mesh);return {scene:sc,cam:cam,mesh:mesh};}
    function pose(st,s,tilt){
      st.mesh.geometry=geo(s.shape);st.mesh.material=mat(s.color);
      var rad=st.mesh.geometry.boundingSphere.radius,d=rad/Math.sin(12*Math.PI/180)*1.16/Math.min(1,st.cam.aspect);
      st.cam.position.set(0,Math.sin(tilt)*d,Math.cos(tilt)*d);st.cam.lookAt(0,-.05,0);
    }

    // cards: one renderer, copied into each card's canvas
    var R=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    var size=Math.round(Math.min(2,window.devicePixelRatio||1)*(mob?300:340));R.setPixelRatio(1);R.setSize(size,size,false);R.setClearColor(0xffffff,0);R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
    var cardStage=stage(),cards=[];
    Object.keys(STONES).forEach(function(k){STONES[k].forEach(function(s,i){
      var c=s.card.querySelector('canvas');c.width=c.height=size;cards.push({s:s,c:c,ctx:c.getContext('2d'),ang:i*1.3,vis:false,hover:false});
      s.card.addEventListener('pointerenter',function(){cards.forEach(function(x){if(x.s===s)x.hover=true;});});
      s.card.addEventListener('pointerleave',function(){cards.forEach(function(x){if(x.s===s)x.hover=false;});});
    });});
    function drawCard(cd){
      pose(cardStage,cd.s,.62);cardStage.mesh.rotation.y=cd.ang;
      mat(cd.s.color).uniforms.uRot.value=cd.ang*.5;
      R.render(cardStage.scene,cardStage.cam);
      var x=cd.ctx,w=size;x.fillStyle='#fff';x.fillRect(0,0,w,w);
      var g=x.createRadialGradient(w/2,w*.79,0,w/2,w*.79,w*.34);g.addColorStop(0,'rgba(60,50,40,.22)');g.addColorStop(1,'rgba(60,50,40,0)');
      x.save();x.translate(w/2,w*.79);x.scale(1,.18);x.translate(-w/2,-w*.79);x.fillStyle=g;x.fillRect(0,0,w,w);x.restore();
      x.drawImage(R.domElement,0,0,w,w);
    }
    var io=new IntersectionObserver(function(es){es.forEach(function(e){cards.forEach(function(cd){if(cd.c===e.target)cd.vis=e.isIntersecting;});});},{rootMargin:'60px'});
    cards.forEach(function(cd){io.observe(cd.c);drawCard(cd);});
    window.__collectionShown=function(){cards.forEach(function(cd){if(cd.s.card.offsetParent)drawCard(cd);});};

    var last=0;
    function tick(ms){
      requestAnimationFrame(tick);
      if(still||document.hidden||ms-last<33)return;var dt=Math.min(.1,(ms-last)/1000);last=ms;
      cards.forEach(function(cd){if(!cd.vis||!cd.s.card.offsetParent)return;cd.ang+=dt*(cd.hover?.9:.32);drawCard(cd);});
    }
    requestAnimationFrame(tick);

    // dialog: a live 360° view you can turn by dragging
    if(!dlg)return;
    var vc=dlg.querySelector('canvas'),V=new T.WebGLRenderer({canvas:vc,antialias:true,alpha:true});V.setClearColor(0xffffff,0);V.toneMapping=T.ACESFilmicToneMapping;V.toneMappingExposure=1.15;
    V.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    var vs=stage(),cur=null,yaw=0,tilt=.62,drag=null,vel=.35,raf=0;
    function vsize(){var w=vc.clientWidth,h=vc.clientHeight;if(w&&h){V.setSize(w,h,false);vs.cam.aspect=w/h;vs.cam.updateProjectionMatrix();}}
    vc.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,tilt:tilt};vc.setPointerCapture(e.pointerId);vel=0;});
    vc.addEventListener('pointermove',function(e){if(!drag)return;yaw=drag.yaw+(e.clientX-drag.x)*.012;tilt=Math.max(.05,Math.min(1.45,drag.tilt-(e.clientY-drag.y)*.008));});
    var end=function(){if(drag){drag=null;vel=still?0:.35;}};vc.addEventListener('pointerup',end);vc.addEventListener('pointercancel',end);
    vc.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=.2;if(e.key==='ArrowRight')yaw+=.2;if(e.key==='ArrowUp')tilt=Math.max(.05,tilt-.1);if(e.key==='ArrowDown')tilt=Math.min(1.45,tilt+.1);});
    var vlast=0;
    function vloop(ms){if(!dlg.open){raf=0;return;}raf=requestAnimationFrame(vloop);var dt=vlast?Math.min(.05,(ms-vlast)/1000):0;vlast=ms;
      if(!still)yaw+=dt*vel;pose(vs,cur,tilt);vs.mesh.rotation.y=yaw;mat(cur.color).uniforms.uRot.value=yaw*.5;V.render(vs.scene,vs.cam);}
    dialogShow=function(s,k){openDialog(s,k,function(){cur=s;yaw=0;tilt=.62;vel=still?0:.35;requestAnimationFrame(function(){vsize();vlast=0;if(!raf)raf=requestAnimationFrame(vloop);});});};
    window.addEventListener('resize',function(){if(dlg.open)vsize();});
  }
})();
