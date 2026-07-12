import{i as e,s as t}from"./preload-helper-CT_b8DTk.js";import{z as n}from"./iframe-C4Mo0zok.js";import{t as r}from"./jsx-runtime-DqZldVDK.js";import{n as i,t as a}from"./Modal-CtqLqyG_.js";import{n as o,t as s}from"./PrivacyPolicy-D__4gV85.js";var c,l,u,d,f,p,m,h,g,_;e((()=>{i(),o(),c=t(n()),l=r(),{expect:u,fireEvent:d}=__STORYBOOK_MODULE_TEST__,f={component:a,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Modal`},p={args:{children:(0,l.jsx)(`p`,{children:`Sample modal content.`}),onClose:()=>null,show:!0},decorators:[e=>(0,l.jsx)(`div`,{style:{minHeight:`300px`,position:`relative`},children:(0,l.jsx)(e,{})})]},m={children:(0,l.jsx)(s,{}),onClose:()=>null,show:!0},h={args:m,play:async({canvasElement:e})=>{await u(e).toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}},g={args:m,play:async({canvasElement:e})=>{let t=e.querySelector(`button`);await d.click(t),await u(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)},render:()=>{let[e,t]=(0,c.useState)(!0);return(0,l.jsx)(a,{onClose:()=>t(!1),show:e,children:(0,l.jsx)(s,{})})}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    children: <p>Sample modal content.</p>,
    onClose: () => null,
    show: true
  },
  decorators: [Story => <div style={{
    minHeight: "300px",
    position: "relative"
  }}>
        <Story />
      </div>]
}`,...p.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: privacyPolicyArgs,
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("Privacy Policy for Cribbage Trainer");
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: privacyPolicyArgs,
  play: async ({
    canvasElement
  }) => {
    const closeButton = canvasElement.querySelector("button");
    await fireEvent.click(closeButton!);
    await expect(canvasElement).not.toHaveTextContent("Privacy Policy for Cribbage Trainer");
  },
  render: () => {
    const [show, setShow] = useState(true);
    return <Modal onClose={() => setShow(false)} show={show}>
        <PrivacyPolicyNode />
      </Modal>;
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ShownPrivacyPolicy`,`ClosedPrivacyPolicy`]}))();export{g as ClosedPrivacyPolicy,p as Default,h as ShownPrivacyPolicy,_ as __namedExportsOrder,f as default};