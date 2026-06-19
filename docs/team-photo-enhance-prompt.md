# Team Photo Enhancement Prompt — The Walls (Nano Banana)

Use this to **enhance/restyle real team headshots** for the About page team grid so they
match the website's look. These are **image-to-image edits**: upload one team member's
photo into Nano Banana, paste the prompt below, and run it. Repeat per person.

**Layout it must match:** `.team-photo` is **3:4 portrait**, `object-fit: cover`, sits on a
dark obsidian card, with a subtle desaturation and champagne / antique-gold (`#C9A96E`)
accents — the same palette as the rest of the site.

> ⚠️ **Likeness rule:** because these are real people, the prompt tells the model to keep
> each face/identity exactly. Always review the result — if a face is altered, re-run with
> a tighter "do not change facial features" instruction or a lower edit strength.

---

## Master prompt (paste with each team photo)

```
Enhance and restyle this portrait to a high-end, luxury corporate headshot for an
interior-design and fit-out brand. CRITICAL: preserve the person's exact face, facial
features, expression, skin tone, hairstyle, age and identity from the original photo —
do not alter their likeness or proportions in any way.

Relight as a refined editorial studio portrait: soft warm directional key light from one
side, gentle shadow falloff, and a subtle rim/hair light separating the subject from the
background. Replace the background with a clean, dark obsidian-charcoal studio backdrop
with a soft warm gradient and shallow depth of field. Apply a cinematic color grade with
warm walnut and muted antique-gold (#C9A96E) tones, deep blacks, elegant contrast and
slightly reduced saturation. Natural, realistic skin retouching that keeps real skin
texture (no plastic or over-smoothed look). Sharp focus on the eyes. If wardrobe can be
adjusted, render refined business-formal clothing in dark neutral tones.

Photorealistic, premium commercial portrait quality. Vertical 3:4 portrait aspect ratio,
waist-up to head-and-shoulders composition, subject centered with headroom. No text, no
logos, no watermarks.
```

---

## Keeping all four consistent (important for the grid)

The team grid shows 4 portraits side by side, so they must look like one shoot:

1. Run the **same master prompt** for every person — don't vary it per role.
2. Frame them all the same way (e.g. all waist-up, eyes on the same line).
3. **Best trick:** once you get one portrait you like, attach it as a *style reference*
   alongside the next person's photo and add to the prompt:
   `Match the lighting, background, framing and color grade of the attached reference image.`
   Repeat so all four inherit the first one's look.

## Optional add-ons
- Tighter likeness lock: append `Keep the face 100% identical to the input; only change
  lighting, background and color.`
- More/less drama: swap `soft warm directional key light` for `dramatic low-key side
  lighting` (moodier) or `soft even beauty lighting` (cleaner, brighter).
- Crop note: the site crops to 3:4 and centers — leave a little headroom and side margin
  so nothing important is cut off.
