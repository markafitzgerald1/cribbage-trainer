import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{f as t,m as n}from"./CardLabel-BxaxW3FO.js";import{a as r,i}from"./SortOrderName-DnS2ytQU.js";import{n as a,t as o}from"./SortedCardLabels-BgYM1a2c.js";var s,c,l,u,d,f,p;function m(){return(m=e((()=>{r(),a(),t(),{expect:s}=__STORYBOOK_MODULE_TEST__,c=n(`5H,KS,AC,7D,9C,2S`),l={component:o,parameters:{docs:{description:{component:`Renders card labels sorted by rank or deal order.`}},layout:`centered`},tags:[`autodocs`],title:`SortedCardLabels`},u={args:{cards:c,sortOrder:i.Descending},play:async({canvasElement:e})=>{await s(e).toHaveTextContent(`K♠9♣7♦5♥2♠A♣`)}},d={args:{cards:c,sortOrder:i.Ascending},play:async({canvasElement:e})=>{await s(e).toHaveTextContent(`A♣2♠5♥7♦9♣K♠`)}},f={args:{cards:c,sortOrder:i.DealOrder},play:async({canvasElement:e})=>{await s(e).toHaveTextContent(`5♥K♠A♣7♦9♣2♠`)}},p=[`Descending`,`Ascending`,`DealOrder`],u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.Descending
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("K♠9♣7♦5♥2♠A♣");
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.Ascending
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("A♣2♠5♥7♦9♣K♠");
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    cards: sampleCards,
    sortOrder: SortOrder.DealOrder
  },
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("5♥K♠A♣7♦9♣2♠");
  }
}`,...f.parameters?.docs?.source}}}})))()}m();export{d as Ascending,f as DealOrder,u as Descending,p as __namedExportsOrder,l as default};