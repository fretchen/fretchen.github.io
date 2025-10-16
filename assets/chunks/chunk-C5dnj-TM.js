import{W as S,Q as z,aI as j,_ as u,g as Q,s as Z,a as q,b as H,v as J,t as K,l as F,c as X,G as Y,L as tt,a5 as et,e as at,A as rt,I as nt}from"./chunk-C0vs4EMs.js";import{p as it}from"./chunk-Cuu8hSvd.js";import{p as ot}from"./chunk-DYCjms-a.js";import{d as P}from"./chunk-DbeTkDcJ.js";import{o as st}from"./chunk-DO4YpjyP.js";import"./chunk-DBQ_J0i3.js";import"./chunk-kOh39j1J.js";/* empty css              *//* empty css              */import"./chunk-BDRzeg3d.js";import"./chunk-DmlFjuBC.js";import"./chunk-DF5K452e.js";import"./chunk-D-ZhOCA6.js";import"./chunk-B5FzeXPM.js";import"./chunk-D4mw09ce.js";/* empty css              */import"./chunk-bfu8Usrg.js";import"./chunk-CMmU43Dv.js";import"./chunk-BmVTWgcY.js";import"./chunk-Gi6I4Gst.js";function lt(t,a){return a<t?-1:a>t?1:a>=t?0:NaN}function ct(t){return t}function pt(){var t=ct,a=lt,f=null,x=S(0),o=S(z),l=S(0);function s(e){var n,c=(e=j(e)).length,d,y,h=0,p=new Array(c),i=new Array(c),v=+x.apply(this,arguments),A=Math.min(z,Math.max(-z,o.apply(this,arguments)-v)),m,C=Math.min(Math.abs(A)/c,l.apply(this,arguments)),$=C*(A<0?-1:1),g;for(n=0;n<c;++n)(g=i[p[n]=n]=+t(e[n],n,e))>0&&(h+=g);for(a!=null?p.sort(function(w,D){return a(i[w],i[D])}):f!=null&&p.sort(function(w,D){return f(e[w],e[D])}),n=0,y=h?(A-c*$)/h:0;n<c;++n,v=m)d=p[n],g=i[d],m=v+(g>0?g*y:0)+$,i[d]={data:e[d],index:n,value:g,startAngle:v,endAngle:m,padAngle:C};return i}return s.value=function(e){return arguments.length?(t=typeof e=="function"?e:S(+e),s):t},s.sortValues=function(e){return arguments.length?(a=e,f=null,s):a},s.sort=function(e){return arguments.length?(f=e,a=null,s):f},s.startAngle=function(e){return arguments.length?(x=typeof e=="function"?e:S(+e),s):x},s.endAngle=function(e){return arguments.length?(o=typeof e=="function"?e:S(+e),s):o},s.padAngle=function(e){return arguments.length?(l=typeof e=="function"?e:S(+e),s):l},s}var ut=nt.pie,G={sections:new Map,showData:!1},T=G.sections,W=G.showData,dt=structuredClone(ut),gt=u(()=>structuredClone(dt),"getConfig"),ft=u(()=>{T=new Map,W=G.showData,rt()},"clear"),mt=u(({label:t,value:a})=>{if(a<0)throw new Error(`"${t}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);T.has(t)||(T.set(t,a),F.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),ht=u(()=>T,"getSections"),vt=u(t=>{W=t},"setShowData"),St=u(()=>W,"getShowData"),R={getConfig:gt,clear:ft,setDiagramTitle:K,getDiagramTitle:J,setAccTitle:H,getAccTitle:q,setAccDescription:Z,getAccDescription:Q,addSection:mt,getSections:ht,setShowData:vt,getShowData:St},xt=u((t,a)=>{it(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),yt={parse:u(async t=>{const a=await ot("pie",t);F.debug(a),xt(a,R)},"parse")},At=u(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),wt=At,Dt=u(t=>{const a=[...t.values()].reduce((o,l)=>o+l,0),f=[...t.entries()].map(([o,l])=>({label:o,value:l})).filter(o=>o.value/a*100>=1).sort((o,l)=>l.value-o.value);return pt().value(o=>o.value)(f)},"createPieArcs"),Ct=u((t,a,f,x)=>{F.debug(`rendering pie chart
`+t);const o=x.db,l=X(),s=Y(o.getConfig(),l.pie),e=40,n=18,c=4,d=450,y=d,h=tt(a),p=h.append("g");p.attr("transform","translate("+y/2+","+d/2+")");const{themeVariables:i}=l;let[v]=et(i.pieOuterStrokeWidth);v??=2;const A=s.textPosition,m=Math.min(y,d)/2-e,C=P().innerRadius(0).outerRadius(m),$=P().innerRadius(m*A).outerRadius(m*A);p.append("circle").attr("cx",0).attr("cy",0).attr("r",m+v/2).attr("class","pieOuterCircle");const g=o.getSections(),w=Dt(g),D=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12];let b=0;g.forEach(r=>{b+=r});const I=w.filter(r=>(r.data.value/b*100).toFixed(0)!=="0"),E=st(D);p.selectAll("mySlices").data(I).enter().append("path").attr("d",C).attr("fill",r=>E(r.data.label)).attr("class","pieCircle"),p.selectAll("mySlices").data(I).enter().append("text").text(r=>(r.data.value/b*100).toFixed(0)+"%").attr("transform",r=>"translate("+$.centroid(r)+")").style("text-anchor","middle").attr("class","slice"),p.append("text").text(o.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const N=[...g.entries()].map(([r,M])=>({label:r,value:M})),k=p.selectAll(".legend").data(N).enter().append("g").attr("class","legend").attr("transform",(r,M)=>{const O=n+c,B=O*N.length/2,V=12*n,U=M*O-B;return"translate("+V+","+U+")"});k.append("rect").attr("width",n).attr("height",n).style("fill",r=>E(r.label)).style("stroke",r=>E(r.label)),k.append("text").attr("x",n+c).attr("y",n-c).text(r=>o.getShowData()?`${r.label} [${r.value}]`:r.label);const _=Math.max(...k.selectAll("text").nodes().map(r=>r?.getBoundingClientRect().width??0)),L=y+e+n+c+_;h.attr("viewBox",`0 0 ${L} ${d}`),at(h,d,L,s.useMaxWidth)},"draw"),$t={draw:Ct},Qt={parser:yt,db:R,renderer:$t,styles:wt};export{Qt as diagram};
