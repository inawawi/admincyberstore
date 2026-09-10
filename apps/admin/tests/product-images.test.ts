import test from "node:test";
import assert from "node:assert/strict";
import { planProductGallery } from "../lib/product-images";

const existing = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, image: `old-${index + 1}.jpg` }));

test("galeri lama dibatasi lima foto di luar foto utama", () => {
  assert.deepEqual(planProductGallery(existing, [], [], false), existing.slice(0, 5));
});

test("ganti slot menggantikan foto lama meskipun ID hapus tidak dikirim", () => {
  const result = planProductGallery(existing, [null, "new.jpg"], [], false);
  assert.equal(result.length, 5);
  assert.deepEqual(result[1], { image: "new.jpg" });
  assert.equal(result.some((img) => img.image === "old-2.jpg"), false);
});

test("upload massal lebih sedikit menghapus seluruh sisa foto lama", () => {
  assert.deepEqual(planProductGallery(existing, ["new.jpg"], [], true), [{ image: "new.jpg" }]);
  assert.deepEqual(planProductGallery(existing, [], [], true), []);
});

test("hapus slot tidak menggeser target penggantian slot lain", () => {
  assert.deepEqual(planProductGallery(existing.slice(0, 3), [null, "new.jpg"], [1, 2], false), [
    { image: "new.jpg" }, existing[2],
  ]);
});
