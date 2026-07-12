import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./oppositeRoleLoss-7IahAW-F.js";import{n,t as r}from"./NoiseVerdictBadge-D3iFS38F.js";import{t as i}from"./dist-D_vIddxO.js";var a,o,s,c,l,u,d,f;function p(){return(p=e((()=>{i(),n(),t(),{expect:a,userEvent:o,within:s}=__STORYBOOK_MODULE_TEST__,c={accessibleLabel:`0.06 points lost`,leadingText:``,oppositeRoleCost:`0.06 pts lost`,oppositeRoleCostsNothing:!1},l=async e=>{await o.click(s(e).getByRole(`button`)),await a(s(e).getByText(/^Approximate threshold 0\.07 pts/u)).toBeVisible()},u={component:r,title:`NoiseVerdictBadge`},d={args:{rolePair:c,threshold:.07,title:`Within noise: at or below the approximate 0.07 point threshold.`},play:async({canvasElement:e})=>{await l(e)}},f=[`RevealsThresholdOnTap`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    rolePair: singleFigure,
    threshold: 0.07,
    title: "Within noise: at or below the approximate 0.07 point threshold."
  },
  play: async ({
    canvasElement
  }) => {
    await tapBadgeAndExpectThreshold(canvasElement);
  }
}`,...d.parameters?.docs?.source}}}})))()}p();export{d as RevealsThresholdOnTap,f as __namedExportsOrder,u as default};