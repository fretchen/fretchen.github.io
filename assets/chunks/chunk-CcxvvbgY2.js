import{Bt as e,Hn as t,R as n,Rn as r,Sn as i,St as a,Tt as o,_n as s,ar as c,dn as l,gn as u,in as d,ir as f,j as p,sn as m,yn as h,zn as g,zt as _}from"./chunk-mKn3i_vA2.js";import{t as v}from"./chunk-BmPG0RSV2.js";import{t as y}from"./chunk---MaUr_U2.js";import{t as b}from"./chunk-ndlv0VQa2.js";import{t as x}from"./chunk-BYKtsrA6.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var t=C,n=S,r=null,i=e(0),a=e(_),s=e(0);function c(e){var c,l=(e=o(e)).length,u,d,f=0,p=Array(l),m=Array(l),h=+i.apply(this,arguments),g=Math.min(_,Math.max(-_,a.apply(this,arguments)-h)),v,y=Math.min(Math.abs(g)/l,s.apply(this,arguments)),b=y*(g<0?-1:1),x;for(c=0;c<l;++c)(x=m[p[c]=c]=+t(e[c],c,e))>0&&(f+=x);for(n==null?r!=null&&p.sort(function(t,n){return r(e[t],e[n])}):p.sort(function(e,t){return n(m[e],m[t])}),c=0,d=f?(g-l*b)/f:0;c<l;++c,h=v)u=p[c],x=m[u],v=h+(x>0?x*d:0)+b,m[u]={data:e[u],index:c,value:x,startAngle:h,endAngle:v,padAngle:y};return m}return c.value=function(n){return arguments.length?(t=typeof n==`function`?n:e(+n),c):t},c.sortValues=function(e){return arguments.length?(n=e,r=null,c):n},c.sort=function(e){return arguments.length?(r=e,n=null,c):r},c.startAngle=function(t){return arguments.length?(i=typeof t==`function`?t:e(+t),c):i},c.endAngle=function(t){return arguments.length?(a=typeof t==`function`?t:e(+t),c):a},c.padAngle=function(t){return arguments.length?(s=typeof t==`function`?t:e(+t),c):s},c}var T=l.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:f(()=>structuredClone(k),`getConfig`),clear:f(()=>{D=new Map,O=E.showData,d()},`clear`),setDiagramTitle:t,getDiagramTitle:i,setAccTitle:g,getAccTitle:s,setAccDescription:r,getAccDescription:u,addSection:f(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),c.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:f(()=>D,`getSections`),setShowData:f(e=>{O=e},`setShowData`),getShowData:f(()=>O,`getShowData`)},j=f((e,t)=>{x(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:f(async e=>{let t=await b(`pie`,e);c.debug(t),j(t,A)},`parse`)},N=f(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=f(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:f((e,t,r,i)=>{c.debug(`rendering pie chart
`+e);let o=i.db,s=h(),l=p(o.getConfig(),s.pie),u=a(t),d=u.append(`g`);d.attr(`transform`,`translate(225,225)`);let{themeVariables:f}=s,[g]=n(f.pieOuterStrokeWidth);g??=2;let _=l.textPosition,b=y().innerRadius(0).outerRadius(185),x=y().innerRadius(185*_).outerRadius(185*_);d.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+g/2).attr(`class`,`pieOuterCircle`);let S=o.getSections(),C=P(S),w=[f.pie1,f.pie2,f.pie3,f.pie4,f.pie5,f.pie6,f.pie7,f.pie8,f.pie9,f.pie10,f.pie11,f.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=v(w).domain([...S.keys()]);d.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),d.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=d.append(`text`).text(o.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=d.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>o.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;u.attr(`viewBox`,`${I} 0 ${L} 450`),m(u,450,L,l.useMaxWidth)},`draw`)},styles:N};export{F as diagram};