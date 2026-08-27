const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const $ = (s) => document.querySelector(s);
const ui = { menu:$('#menuScreen'), result:$('#resultScreen'), hud:$('#hud'), score:$('#scoreDisplay'), clock:$('#clockDisplay'), streak:$('#streakDisplay'), record:$('#recordDisplay'), pause:$('#pauseButton'), pauseOverlay:$('#pauseOverlay'), toast:$('#toast') };

let W=0,H=0,dpr=1,mode=30,state='menu',score=0,streak=0,bestStreak=0,made=0,shots=0,timeLeft=30,lastTime=0,timerCarry=0,sound=true,recordBroken=false,neonUntil=0;
let ball, projectiles=[], particles=[], fireworks=[], ripples=[], dragging=false, dragPoint={x:0,y:0}, audioCtx;
const records=JSON.parse(localStorage.getItem('heatCheckRecords')||'{"30":0,"60":0}');
const legendQuotes=[
  {text:"You've got to chase your dreams.",author:'Magic Johnson'},
  {text:"Job's not finished.",author:'Kobe Bryant'},
  {text:"It's my own personal goal to be able to be greater than great.",author:'LeBron James'},
  {text:'Never go out there and see what happens. Go out there and make something happen.',author:'Bill Russell'},
  {text:'You pushed me and made me earn everything I got.',author:'Kobe Bryant'},
  {text:'I practiced all day.',author:'Magic Johnson'}
];
let lastQuote=-1,quoteTimer;

function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);resetBall();}
function resetBall(){
  // Leave a generous pull-back zone below and to the left of the ball on every screen.
  const bottomClearance=Math.max(145,Math.min(185,H*.25));
  ball={x:Math.max(110,W<700?W*.24:W*.28),y:H-bottomClearance,vx:0,vy:0,r:W<500?25:29,flying:false,scored:false,rotation:0,trail:[]};
}
function hoop(){return{x:Math.min(W-105,W*(W<700?.72:.74)),y:Math.max(175,H*(H<700?.32:.35)),rimW:W<500?78:94};}
function shotPower(){return Math.max(6.2,Math.min(7.7,5.75+W/820));}
function updateRecord(){ui.record.textContent=records[mode]||0;}
function show(el,on=true){el.classList.toggle('hidden',!on)}
document.querySelectorAll('.mode-card').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');mode=+b.dataset.time;updateRecord();tone(330,.05)}));
$('#startButton').onclick=()=>$('#windowNotice').classList.remove('dismissed');$('#replayButton').onclick=startGame;$('#menuButton').onclick=showMenu;$('#homeButton').onclick=showMenu;
$('#dismissNotice').onclick=()=>{$('#windowNotice').classList.add('dismissed');startGame()};
$('#pauseButton').onclick=()=>pause(true);$('#resumeButton').onclick=()=>pause(false);$('#soundButton').onclick=()=>{sound=!sound;$('#soundButton').textContent=sound?'♪':'×';};
function startGame(){state='playing';score=streak=bestStreak=made=shots=timerCarry=0;timeLeft=mode;recordBroken=false;projectiles=[];particles=[];fireworks=[];ripples=[];resetBall();show(ui.menu,false);show(ui.result,false);show(ui.hud);show(ui.pause);show(ui.pauseOverlay,false);updateHUD();lastTime=performance.now();tone(440,.08);}
function showMenu(){state='menu';show(ui.menu);show(ui.result,false);show(ui.hud,false);show(ui.pause,false);show(ui.pauseOverlay,false);updateRecord();}
function pause(on){if(state!=='playing'&&state!=='paused')return;state=on?'paused':'playing';show(ui.pauseOverlay,on);if(!on)lastTime=performance.now();}
function endGame(){state='result';show(ui.result);show(ui.hud,false);show(ui.pause,false);const old=records[mode]||0,isNew=score>old;if(isNew){records[mode]=score;localStorage.setItem('heatCheckRecords',JSON.stringify(records));}$('#finalScore').textContent=score;$('#madeStat').textContent=made;$('#bestStreakStat').textContent=bestStreak+'×';$('#accuracyStat').textContent=shots?Math.round(made/shots*100)+'%':'0%';$('#newRecord').textContent=isNew?'NEW PERSONAL BEST':'PERSONAL BEST: '+records[mode];$('#resultTitle').textContent=isNew?'RECORD HEAT!':score>=20?'PURE FIRE!':score>=10?'NICE RUN!':'KEEP SHOOTING!';updateRecord();tone(220,.12);setTimeout(()=>tone(330,.12),130);setTimeout(()=>tone(440,.2),260);}
function updateHUD(){ui.score.textContent=score;ui.streak.textContent=streak+'×';ui.clock.textContent='00:'+String(Math.max(0,Math.ceil(timeLeft))).padStart(2,'0');ui.clock.style.color=timeLeft<=10?'#ff6232':'white';}
function pointer(e){const r=canvas.getBoundingClientRect(),t=e.touches?.[0]||e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{if(state!=='playing'||ball.flying)return;const p=pointer(e);if(Math.hypot(p.x-ball.x,p.y-ball.y)<65){dragging=true;dragPoint=p;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(dragging)dragPoint=pointer(e)});
canvas.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const dx=ball.x-dragPoint.x,dy=ball.y-dragPoint.y,p=Math.min(1,Math.hypot(dx,dy)/150);if(p>.12){const boost=shotPower();ball.vx=dx*boost;ball.vy=dy*boost;ball.flying=true;projectiles.push(ball);shots++;sfx('shoot');resetBall()}});

function tone(freq,duration){if(!sound)return;try{audioCtx ||= new (AudioContext||webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}
function noise(duration,frequency,gain=.06){if(!sound)return;try{audioCtx ||= new (AudioContext||webkitAudioContext)();const length=audioCtx.sampleRate*duration,b=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=b.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=b;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);src.connect(filter).connect(g).connect(audioCtx.destination);src.start()}catch{}}
function sfx(type){if(!sound)return;if(type==='shoot'){noise(.16,850,.045);tone(105,.07)}if(type==='bounce'){tone(82,.09);noise(.06,180,.035)}if(type==='rim'){tone(1280,.12);setTimeout(()=>tone(920,.1),22)}if(type==='backboard'){noise(.11,310,.09);tone(145,.07)}if(type==='swish'){noise(.28,2300,.085);setTimeout(()=>noise(.18,1500,.04),70)}if(type==='crowd'){noise(.8,720,.06);[330,392,494,587].forEach((f,i)=>setTimeout(()=>tone(f,.28),i*55))}}
function showLegendQuote(){let next;do{next=Math.floor(Math.random()*legendQuotes.length)}while(next===lastQuote&&legendQuotes.length>1);lastQuote=next;const q=legendQuotes[next],card=$('#legendQuote'),h=hoop(),cardW=Math.min(310,W-24);$('#quoteText').textContent='“'+q.text+'”';$('#quoteAuthor').textContent=q.author;card.style.left=Math.max(12,Math.min(W-cardW-12,h.x-cardW*.56))+'px';card.style.top=Math.min(H-125,h.y+82)+'px';clearTimeout(quoteTimer);card.classList.add('hidden');void card.offsetWidth;card.classList.remove('hidden');quoteTimer=setTimeout(()=>card.classList.add('hidden'),2800)}
function makeScore(){const scoredBall=ball;ball.scored=true;neonUntil=performance.now()+1100;showLegendQuote();made++;streak++;bestStreak=Math.max(bestStreak,streak);score+=streak>=2?3:2;updateHUD();sfx('swish');if(streak>=2)setTimeout(()=>sfx('crowd'),100);const h=hoop();ripples.push({x:h.x,y:h.y+10,a:1,r:10});for(let i=0;i<24;i++)particles.push({x:h.x,y:h.y,vx:(Math.random()-.5)*230,vy:-Math.random()*180-30,life:1,color:i%3?'#ff5a1f':'#ffbd19'});if(!recordBroken&&score>(records[mode]||0)){recordBroken=true;recordFireworks()}else if(streak===2){ui.toast.textContent='ON FIRE!';show(ui.toast);setTimeout(()=>show(ui.toast,false),900)}else if(streak>2){ui.toast.textContent=streak+'× HEAT!';show(ui.toast);setTimeout(()=>show(ui.toast,false),900)}setTimeout(()=>{scoredBall.expired=true},420)}
function fireworkBurst(x,y,color){tone(110+Math.random()*70,.08);for(let i=0;i<42;i++){const a=Math.PI*2*i/42+Math.random()*.12,s=90+Math.random()*210;fireworks.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,max:1,color,size:2+Math.random()*2})}}
function recordFireworks(){ui.toast.textContent='NEW RECORD!';show(ui.toast);setTimeout(()=>show(ui.toast,false),1400);const colors=['#ffbd19','#ff5a1f','#5ee7ff','#ff65c3','#b3ff55'];[[.22,.27,0],[.5,.18,180],[.78,.3,360],[.36,.35,540],[.66,.2,720]].forEach(([x,y,delay],i)=>setTimeout(()=>{if(state==='playing')fireworkBurst(W*x,H*y,colors[i])},delay))}
function miss(){if(ball.expired)return;if(!ball.scored&&streak){streak=0;updateHUD()}ball.expired=true}
function physics(dt){if(!ball.flying)return;ball.trail.push({x:ball.x,y:ball.y,a:1});if(ball.trail.length>16)ball.trail.shift();const prevY=ball.y;ball.vy+=780*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.rotation+=ball.vx*dt/ball.r;const h=hoop(),rimY=h.y;
  if(!ball.scored&&ball.vy>0&&prevY<rimY&&ball.y>=rimY&&Math.abs(ball.x-h.x)<h.rimW*.38)makeScore();
  const boardX=h.x+h.rimW/2+9,boardTop=h.y-(W<500?112:142),boardBottom=h.y-5;
  if(ball.vx>0&&ball.x+ball.r>=boardX&&ball.x-ball.r<boardX&&ball.y+ball.r>boardTop&&ball.y-ball.r<boardBottom){ball.x=boardX-ball.r;ball.vx*=-.72;ball.vy*=.96;sfx('backboard')}
  const rimPts=[h.x-h.rimW/2,h.x+h.rimW/2];rimPts.forEach(rx=>{const d=Math.hypot(ball.x-rx,ball.y-rimY);if(d<ball.r+5){const nx=(ball.x-rx)/d,ny=(ball.y-rimY)/d,dot=ball.vx*nx+ball.vy*ny;if(dot<0){if(!ball.lastRim||performance.now()-ball.lastRim>90){sfx('rim');ball.lastRim=performance.now()}ball.vx-=1.65*dot*nx;ball.vy-=1.65*dot*ny}}});
  if(ball.y>H-ball.r){if(Math.abs(ball.vy)>105&&(!ball.lastBounce||performance.now()-ball.lastBounce>100)){sfx('bounce');ball.lastBounce=performance.now()}ball.y=H-ball.r;ball.vy*=-.55;ball.vx*=.78;if(Math.abs(ball.vy)<70)miss()}if(ball.x<-70||ball.x>W+70||ball.y>H+100)miss();
}
function update(dt){if(state==='playing'){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;updateHUD();endGame();return}timerCarry+=dt;if(timerCarry>.12){updateHUD();timerCarry=0}const readyBall=ball;projectiles.forEach(shot=>{ball=shot;physics(dt)});ball=readyBall;projectiles=projectiles.filter(shot=>!shot.expired)}particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=350*dt;p.life-=dt*1.3});particles=particles.filter(p=>p.life>0);fireworks.forEach(p=>{p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy=p.vy*.985+115*dt;p.life-=dt*.72});fireworks=fireworks.filter(p=>p.life>0);[ball,...projectiles].forEach(b=>b?.trail.forEach(t=>t.a-=dt*3));ripples.forEach(r=>{r.r+=100*dt;r.a-=dt*1.5});ripples=ripples.filter(r=>r.a>0)}
function court(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#111936');g.addColorStop(.55,'#182040');g.addColorStop(1,'#101529');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,255,255,.055)';ctx.lineWidth=2;for(let x=-H;x<W+H;x+=72){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+H,H);ctx.stroke()}ctx.fillStyle='rgba(255,255,255,.025)';ctx.beginPath();ctx.arc(W*.5,H*1.1,H*.45,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,90,31,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(W*.5,H*1.1,H*.45,Math.PI,Math.PI*2);ctx.stroke()}
function drawNeonSign(){const lit=performance.now()<neonUntil,x=W*.5,y=Math.max(76,H*.13),fontSize=Math.max(24,Math.min(39,W*.035));ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`italic 900 ${fontSize}px Barlow Condensed`;ctx.strokeStyle=lit?'rgba(255,87,29,.24)':'rgba(255,255,255,.07)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-fontSize*2.15,y-fontSize*.72,fontSize*4.3,fontSize*1.42,10);ctx.stroke();ctx.fillStyle=lit?'#fff1dc':'rgba(255,108,55,.18)';ctx.shadowColor='#ff4f18';ctx.shadowBlur=lit?30:5;ctx.fillText('HEAT CHECK',x,y);if(lit){ctx.strokeStyle='#ff5a1f';ctx.lineWidth=1;ctx.strokeText('HEAT CHECK',x,y)}ctx.restore()}
function drawBallCart(){
  const rackW=W<500?106:142,rackH=W<500?108:134,left=Math.max(10,ball.x-rackW-58),floor=ball.y+72,top=floor-rackH;
  const railLeft=left+14,railRight=left+rackW-12;
  ctx.lineCap='round';ctx.lineJoin='round';
  // Professional courtside rack: two upright steel tubes and a wide non-tip base.
  ctx.strokeStyle='#b8c1cf';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(railLeft,top+4);ctx.lineTo(railLeft+3,floor-13);ctx.moveTo(railRight,top);ctx.lineTo(railRight-3,floor-13);ctx.stroke();
  ctx.strokeStyle='#dce2ea';ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(left+2,floor-12);ctx.lineTo(left+rackW,floor-12);ctx.stroke();
  // Three exposed, slightly angled rails—no basket or mesh enclosure.
  const railYs=[top+23,top+61,top+99];
  railYs.forEach((y,i)=>{if(y>floor-25)return;ctx.strokeStyle='#8f9aaa';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(railLeft,y+4);ctx.lineTo(railRight,y);ctx.stroke();ctx.strokeStyle='#e2e7ee';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(railLeft,y+1);ctx.lineTo(railRight,y-3);ctx.stroke()});
  // Full-size balls rest individually on the open rails.
  const r=W<500?12:14;
  railYs.forEach((y,row)=>{if(y>floor-25)return;const count=W<500?3:4;for(let i=0;i<count;i++){const x=railLeft+10+i*(railRight-railLeft-20)/(count-1),cy=y-r+1-i*1.2;ctx.fillStyle='#e96525';ctx.beginPath();ctx.arc(x,cy,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#51241a';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,cy,r,0,Math.PI*2);ctx.moveTo(x-r,cy);ctx.lineTo(x+r,cy);ctx.moveTo(x,cy-r);ctx.lineTo(x,cy+r);ctx.stroke()}});
  // Four locking swivel casters beneath the broad base.
  ctx.fillStyle='#20283a';ctx.strokeStyle='#dce2ea';ctx.lineWidth=3;
  [left+13,left+rackW-13].forEach(x=>{ctx.strokeStyle='#929dac';ctx.beginPath();ctx.moveTo(x,floor-10);ctx.lineTo(x,floor-2);ctx.stroke();ctx.fillStyle='#20283a';ctx.strokeStyle='#dce2ea';ctx.beginPath();ctx.arc(x,floor+4,8,0,Math.PI*2);ctx.fill();ctx.stroke()});
  ctx.lineCap='butt';ctx.lineJoin='miter';
}
function drawHoop(){
  const h=hoop(),boardX=h.x+h.rimW/2+9,boardTop=h.y-(W<500?112:142),boardBottom=h.y-5;
  ctx.lineCap='round';ctx.strokeStyle='#58667e';ctx.lineWidth=15;
  ctx.beginPath();ctx.moveTo(boardX+13,boardTop+26);ctx.lineTo(boardX+48,H+18);ctx.stroke();
  ctx.strokeStyle='#91a0b8';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(boardX+10,h.y-36);ctx.lineTo(boardX+44,h.y+82);ctx.lineTo(h.x+30,h.y+12);ctx.stroke();
  ctx.save();ctx.shadowColor='rgba(145,220,255,.42)';ctx.shadowBlur=20;
  const glass=ctx.createLinearGradient(boardX,0,boardX+18,0);
  glass.addColorStop(0,'#f8fcff');glass.addColorStop(.3,'#b8d7e8');glass.addColorStop(1,'#607c92');
  ctx.fillStyle=glass;ctx.beginPath();ctx.moveTo(boardX,boardTop);ctx.lineTo(boardX+18,boardTop+8);ctx.lineTo(boardX+18,boardBottom);ctx.lineTo(boardX,boardBottom);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.restore();
  ctx.strokeStyle='#ff8a53';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(boardX,h.y-53);ctx.lineTo(boardX,h.y-18);ctx.stroke();
  ctx.fillStyle='#d9e2ec';ctx.fillRect(boardX-7,h.y-21,15,25);
  ctx.strokeStyle='#ff541c';ctx.lineWidth=9;ctx.shadowColor='rgba(255,73,20,.5)';ctx.shadowBlur=9;
  ctx.beginPath();ctx.moveTo(h.x-h.rimW/2,h.y);ctx.lineTo(h.x+h.rimW/2,h.y);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#ff6a25';ctx.beginPath();ctx.arc(h.x-h.rimW/2,h.y,6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(248,250,245,.82)';ctx.lineWidth=2;
  for(let i=0;i<7;i++){const x=h.x-h.rimW/2+i*h.rimW/6;ctx.beginPath();ctx.moveTo(x,h.y+4);ctx.lineTo(h.x+(i-3)*4,h.y+65);ctx.stroke()}
  for(let y=16;y<65;y+=15){ctx.beginPath();ctx.moveTo(h.x-h.rimW/2+y*.38,h.y+y);ctx.lineTo(h.x+h.rimW/2-y*.38,h.y+y);ctx.stroke()}
  ctx.lineCap='butt';
}
function drawBall(){if(!ball)return;const fiery=streak>=2;if(fiery){ball.trail.forEach((t,i)=>{if(t.a<=0)return;ctx.globalAlpha=t.a*(i/ball.trail.length);ctx.fillStyle=i%2?'#ff3d0b':'#ffb000';ctx.beginPath();ctx.arc(t.x,t.y,ball.r*(.3+i/ball.trail.length*.7),0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.shadowColor='#ff4d00';ctx.shadowBlur=25}ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(ball.rotation);const g=ctx.createRadialGradient(-8,-9,2,0,0,ball.r);g.addColorStop(0,'#ff9b42');g.addColorStop(.7,'#f36522');g.addColorStop(1,'#a93312');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#3a1c19';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,ball.r,0,Math.PI*2);ctx.moveTo(-ball.r,0);ctx.bezierCurveTo(-8,-7,8,-7,ball.r,0);ctx.moveTo(-ball.r,0);ctx.bezierCurveTo(-8,7,8,7,ball.r,0);ctx.moveTo(0,-ball.r);ctx.lineTo(0,ball.r);ctx.stroke();ctx.restore();ctx.shadowBlur=0;if(dragging){ctx.strokeStyle='rgba(255,255,255,.65)';ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);const dx=ball.x-dragPoint.x,dy=ball.y-dragPoint.y,boost=shotPower();for(let i=1;i<15;i++){const t=i*.055;ctx.lineTo(ball.x+dx*boost*t,ball.y+dy*boost*t+390*t*t)}ctx.stroke();ctx.setLineDash([])}}
function render(){court();if(state!=='menu'){drawNeonSign();drawHoop()}ripples.forEach(r=>{ctx.globalAlpha=r.a;ctx.strokeStyle='#ffbd19';ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke()});ctx.globalAlpha=1;if(state==='playing'||state==='paused'){drawBallCart();const readyBall=ball,wasDragging=dragging;dragging=false;projectiles.forEach(shot=>{ball=shot;drawBall()});ball=readyBall;dragging=wasDragging;drawBall()}particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)});fireworks.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke()});ctx.shadowBlur=0;ctx.globalAlpha=1}
function loop(t){const dt=Math.min((t-lastTime)/1000,.033)||0;lastTime=t;if(state!=='paused')update(dt);render();requestAnimationFrame(loop)}
addEventListener('resize',resize);resize();updateRecord();requestAnimationFrame(loop);
