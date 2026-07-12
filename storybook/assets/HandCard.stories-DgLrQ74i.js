import{i as e}from"./preload-helper-CT_b8DTk.js";import{d as t,l as n,o as r,r as i}from"./CardLabel-BhZER6fd.js";import{n as a,t as o}from"./stories.common-DS7hcHEz.js";import{n as s,t as c}from"./HandCard-CfvLyA45.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{t(),a(),s(),l={argTypes:o(`rank`,r),component:c,parameters:{layout:`centered`},tags:[`autodocs`],title:`HandCard`},u=({dealOrderIndex:e,kept:t,rank:n,suit:r})=>({args:{dealOrderIndex:e,kept:t,onChange:()=>null,rank:n,suit:r}}),d={FIFTH:4,FIRST:0,FOURTH:3,SECOND:1,SIXTH:5,THIRD:2},f=u({dealOrderIndex:d.FIRST,kept:!1,rank:i.ACE.rank,suit:n.HEARTS}),p=u({dealOrderIndex:d.SECOND,kept:!0,rank:i.FIVE.rank,suit:n.DIAMONDS}),m=u({dealOrderIndex:d.THIRD,kept:!0,rank:i.NINE.rank,suit:n.CLUBS}),h=u({dealOrderIndex:d.FOURTH,kept:!0,rank:i.TEN.rank,suit:n.SPADES}),g=u({dealOrderIndex:d.FIFTH,kept:!0,rank:i.JACK.rank,suit:n.HEARTS}),_=u({dealOrderIndex:d.SIXTH,kept:!1,rank:i.KING.rank,suit:n.DIAMONDS}),f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FIRST,
  kept: false,
  rank: CARDS.ACE.rank,
  suit: Suit.HEARTS
})`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.SECOND,
  kept: true,
  rank: CARDS.FIVE.rank,
  suit: Suit.DIAMONDS
})`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.THIRD,
  kept: true,
  rank: CARDS.NINE.rank,
  suit: Suit.CLUBS
})`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FOURTH,
  kept: true,
  rank: CARDS.TEN.rank,
  suit: Suit.SPADES
})`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.FIFTH,
  kept: true,
  rank: CARDS.JACK.rank,
  suit: Suit.HEARTS
})`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`createStory({
  dealOrderIndex: DEAL_ORDER_INDEX.SIXTH,
  kept: false,
  rank: CARDS.KING.rank,
  suit: Suit.DIAMONDS
})`,..._.parameters?.docs?.source}}},v=[`DiscardedFirstCardAceHearts`,`KeptSecondCardFiveDiamonds`,`KeptThirdCardNineClubs`,`KeptFourthCardTenSpades`,`KeptFifthCardJackHearts`,`DiscardedSixthCardKingDiamonds`]}))();export{f as DiscardedFirstCardAceHearts,_ as DiscardedSixthCardKingDiamonds,g as KeptFifthCardJackHearts,h as KeptFourthCardTenSpades,p as KeptSecondCardFiveDiamonds,m as KeptThirdCardNineClubs,v as __namedExportsOrder,l as default};