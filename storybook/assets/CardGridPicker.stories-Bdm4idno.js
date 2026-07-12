import{i as e}from"./preload-helper-CT_b8DTk.js";import{a as t,d as n,r}from"./CardLabel-BhZER6fd.js";import{n as i,t as a}from"./CardGridPicker-BBUoEof6.js";var o,s,c,l,u,d,f,p;e((()=>{n(),i(),{expect:o,fn:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={args:{onToggle:s(),selectedCards:[],selectionFull:!1},component:a,tags:[`autodocs`],title:`CardGridPicker`},d={play:async({args:e,canvasElement:t})=>{await c.click(l(t).getByRole(`button`,{name:`A♣`})),await o(e.onToggle).toHaveBeenCalledWith(r.ACE)}},f={args:{selectedCards:t.slice(0,6),selectionFull:!0}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "A♣"
    }));
    await expect(args.onToggle).toHaveBeenCalledWith(CARDS.ACE);
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    selectedCards: DECK.slice(0, 6),
    selectionFull: true
  }
}`,...f.parameters?.docs?.source}}},p=[`Empty`,`Full`]}))();export{d as Empty,f as Full,p as __namedExportsOrder,u as default};