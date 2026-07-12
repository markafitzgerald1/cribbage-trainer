import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{n as t,t as n}from"./RecordedTableProvenance-D9but293.js";import{i as r,t as i}from"./tableIdentity-BjcQ4DRH.js";import{o as a,s as o}from"./PracticeDrillPanel.test.common-BMX1X-Gq.js";var s,c,l,u,d,f,p,m,h,g;function _(){return(_=e((()=>{t(),a(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u=12,d={args:{identity:null},component:n,tags:[`autodocs`],title:`RecordedTableProvenance`},f={play:async({canvasElement:e})=>{await s(l(e).getByText(`Original tables unknown`)).toBeVisible()}},p=async({args:e,canvasElement:t})=>{let n=l(t),r=e.identity,i=n.getByText(`Crib: ${r.crib.means_sha256.slice(0,u)}…`);await s(i).not.toBeVisible(),await c.click(n.getByText(/Judged with/u)),await s(i).toBeVisible(),await s(i).toHaveAttribute(`title`,r.crib.means_sha256),await s(i).toHaveAccessibleName(`Crib table fingerprint ${r.crib.means_sha256.slice(0,u)}`),await s(n.getByRole(`note`,{name:`Play table fingerprint ${r.play.means_sha256.slice(0,u)}`})).toBeVisible()},m={args:{identity:o},play:p},h={args:{identity:r},play:p},g=[`Unknown`,`Different`,`Current`],f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    await expect(within(canvasElement).getByText("Original tables unknown")).toBeVisible();
  }
}`,...f.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    identity: originalIdentity
  },
  play: expandProvenance
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    identity: shippedTableIdentity
  },
  play: expandProvenance
}`,...h.parameters?.docs?.source}}}})))()}_();export{h as Current,m as Different,f as Unknown,g as __namedExportsOrder,d as default};