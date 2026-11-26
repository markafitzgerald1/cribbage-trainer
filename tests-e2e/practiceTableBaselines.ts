// Each project retains its measured pre-layout table budget, including device-profile rounding.
export const practiceTableBaselines = new Map([
  [
    "chromium",
    new Map([
      [
        "desktop XLarge portrait",
        { missHeight: 98, missRows: 0, successHeight: 146, successRows: 1 },
      ],
      [
        "desktop XLarge landscape",
        { missHeight: 532, missRows: 8, successHeight: 568, successRows: 8 },
      ],
      [
        "desktop XLarge short landscape",
        { missHeight: 415, missRows: 6, successHeight: 451, successRows: 6 },
      ],
      [
        "mobile 125% portrait",
        { missHeight: 177, missRows: 3, successHeight: 206, successRows: 4 },
      ],
      [
        "Pixel 125% portrait",
        { missHeight: 212, missRows: 4, successHeight: 243, successRows: 4 },
      ],
      [
        "mobile 125% short landscape",
        { missHeight: 270, missRows: 4, successHeight: 296, successRows: 5 },
      ],
    ]),
  ],
  [
    "firefox",
    new Map([
      [
        "desktop XLarge portrait",
        { missHeight: 88, missRows: 0, successHeight: 141, successRows: 0 },
      ],
      [
        "desktop XLarge landscape",
        { missHeight: 511, missRows: 7, successHeight: 549, successRows: 8 },
      ],
      [
        "desktop XLarge short landscape",
        { missHeight: 411, missRows: 6, successHeight: 449, successRows: 6 },
      ],
      [
        "mobile 125% portrait",
        { missHeight: 157, missRows: 1, successHeight: 188, successRows: 2 },
      ],
      [
        "Pixel 125% portrait",
        { missHeight: 192, missRows: 2, successHeight: 225, successRows: 4 },
      ],
      [
        "mobile 125% short landscape",
        { missHeight: 264, missRows: 4, successHeight: 293, successRows: 5 },
      ],
    ]),
  ],
  [
    "webkit",
    new Map([
      [
        "desktop XLarge portrait",
        { missHeight: 87, missRows: 0, successHeight: 139, successRows: 0 },
      ],
      [
        "desktop XLarge landscape",
        { missHeight: 508, missRows: 7, successHeight: 547, successRows: 8 },
      ],
      [
        "desktop XLarge short landscape",
        { missHeight: 409, missRows: 5, successHeight: 448, successRows: 6 },
      ],
      [
        "mobile 125% portrait",
        { missHeight: 151, missRows: 2, successHeight: 183, successRows: 3 },
      ],
      [
        "Pixel 125% portrait",
        { missHeight: 190, missRows: 3, successHeight: 223, successRows: 4 },
      ],
      [
        "mobile 125% short landscape",
        { missHeight: 264, missRows: 4, successHeight: 293, successRows: 5 },
      ],
    ]),
  ],
  [
    "Mobile Chrome",
    new Map([
      [
        "desktop XLarge portrait",
        { missHeight: 98, missRows: 0, successHeight: 146, successRows: 1 },
      ],
      [
        "desktop XLarge landscape",
        { missHeight: 532, missRows: 8, successHeight: 568, successRows: 8 },
      ],
      [
        "desktop XLarge short landscape",
        { missHeight: 415, missRows: 6, successHeight: 451, successRows: 6 },
      ],
      [
        "mobile 125% portrait",
        { missHeight: 177, missRows: 3, successHeight: 206, successRows: 4 },
      ],
      [
        "Pixel 125% portrait",
        { missHeight: 212, missRows: 4, successHeight: 243, successRows: 4 },
      ],
      [
        "mobile 125% short landscape",
        { missHeight: 270, missRows: 5, successHeight: 296, successRows: 5 },
      ],
    ]),
  ],
  [
    "Mobile Safari",
    new Map([
      [
        "desktop XLarge portrait",
        { missHeight: 87, missRows: 0, successHeight: 139, successRows: 0 },
      ],
      [
        "desktop XLarge landscape",
        { missHeight: 508, missRows: 7, successHeight: 547, successRows: 8 },
      ],
      [
        "desktop XLarge short landscape",
        { missHeight: 409, missRows: 6, successHeight: 448, successRows: 6 },
      ],
      [
        "mobile 125% portrait",
        { missHeight: 151, missRows: 2, successHeight: 183, successRows: 3 },
      ],
      [
        "Pixel 125% portrait",
        { missHeight: 190, missRows: 3, successHeight: 223, successRows: 4 },
      ],
      [
        "mobile 125% short landscape",
        { missHeight: 264, missRows: 4, successHeight: 293, successRows: 5 },
      ],
    ]),
  ],
]);
