import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./jsx-runtime-MKhVqBIO.js";import{f as n,u as r}from"./Card-CHdb2ilR.js";import{i,n as a,r as o,t as s}from"./OpeningPlays-DWbyB1gC.js";import{s as c,t as l}from"./expectedCribPoints-8d5tp5A9.js";import{t as u}from"./dist-D_vIddxO.js";var d,f,p,m,h;function g(){return(g=e((()=>{r(),d=[`8D`,`2C`,`7H`,`3S`].map(n),f=(e,t)=>({count:t,lead:e,mean:0,standardError:0}),p=([e,t,n,r])=>({...f(e,t),response:n,responseCount:r}),f(1,5515),f(2,7485),[[0,696,2,475],[1,1078,1,1078],[2,1689,2,1689],[3,2492,6,2487],[5,989,6,989],[6,846,7,846],[7,659,7,622],[8,521,2,481],[9,1239,2,1238],[10,1313,2,1249],[11,918,2,697],[12,560,2,560]].map(p),m=(e,t=null)=>({getPegLinesSync:()=>t,loadPegLines:e,subscribe:()=>()=>null}),h=e=>m(async()=>Promise.resolve(e))})))()}var _,v,y,b,x,S,C,w,T,E,D,O;function k(){return(k=e((()=>{g(),u(),i(),c(),_=t(),{expect:v,userEvent:y,within:b}=__STORYBOOK_MODULE_TEST__,x=1e4,S={backgroundColor:`#0f5132`,padding:`8px`},C=async(e,t)=>{let n=b(e),r=n.getByRole(`button`,{name:`Opening plays`});await v(r).toHaveAttribute(`aria-expanded`,`false`),await y.click(r),await v(r).toHaveAttribute(`aria-expanded`,`true`),await v(await n.findByText(t,{},{timeout:x})).toBeInTheDocument()},w={args:{keep:d},component:o,decorators:[e=>(0,_.jsx)(`div`,{style:S,children:(0,_.jsx)(e,{})})],title:`OpeningPlays`},T={args:{cribRole:l.Pone},play:async({canvasElement:e})=>{await C(e,`You lead 3 in 58% of hands`),await v(b(e).getByText(s)).toBeVisible()}},E={args:{cribRole:l.Dealer},play:async({canvasElement:e})=>{await C(e,`They lead J in 10% of hands, and you reply 3 in 95% of those`)}},D={args:{cribRole:l.Pone,source:h(null)},play:async({canvasElement:e})=>{await C(e,a)}},O=[`Pone`,`Dealer`,`Unavailable`],T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    cribRole: CribRole.Pone
  },
  play: async ({
    canvasElement
  }) => {
    await openAndExpect(canvasElement, "You lead 3 in 58% of hands");
    await expect(within(canvasElement).getByText(OPENING_PLAYS_FOOTER)).toBeVisible();
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    cribRole: CribRole.Dealer
  },
  play: async ({
    canvasElement
  }) => {
    await openAndExpect(canvasElement, "They lead J in 10% of hands, and you reply 3 in 95% of those");
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    cribRole: CribRole.Pone,
    source: resolvingSource(null)
  },
  play: async ({
    canvasElement
  }) => {
    await openAndExpect(canvasElement, OPENING_PLAYS_UNAVAILABLE);
  }
}`,...D.parameters?.docs?.source}}}})))()}k();export{E as Dealer,T as Pone,D as Unavailable,O as __namedExportsOrder,w as default};