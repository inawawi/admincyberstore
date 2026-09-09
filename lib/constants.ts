export const mabaColorOptions = [
  ["Hitam", "#080808"], ["Putih", "#FFFFFF"], ["Abu-abu", "#808080"],
  ["Merah", "#FF0000"], ["Biru", "#0400FF"], ["Hijau", "#00FF00"],
  ["Kuning", "#FFFF00"], ["Orange", "#FFA500"], ["Pink", "#FF007B"],
  ["Ungu", "#FF00EA"], ["Cokelat", "#A52A2A"], ["Navy", "#000080"],
].map(([value, hex]) => ({ value, label: `${value} (${hex})`, hex }));
