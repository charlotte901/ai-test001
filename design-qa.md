# AIQUOS visual verification

final result: passed

## Latest revision: five-stage assessment map and task surfaces

Source visual truth: the user-selected task-screen mock at `/var/folders/xd/w7bm0l8j6dlf_y7pgh5s1qsr0000gn/T/codex-clipboard-ea2b09ba-0e25-4eaf-bcce-7a71a1f7f5a6.png` (1672 × 941). Its governing anatomy is the pure category-color field, local white TEST! artwork in the upper left, five-node progress trail in the upper right, a single white rounded work surface, and two small IP guides peeking over that surface.

Implementation evidence: local route `#assessment/conversation/level/3`; in-app browser capture `/private/tmp/aiquos-assessment-mobile-final.jpg` (312 × 610 CSS pixels at the current narrow browser surface). The reference and an earlier normalized implementation capture were placed in one comparison image at `/private/tmp/aiquos-assessment-comparison.png`. The in-app browser could not maintain a larger requested viewport and reset to the active narrow surface, so the responsive narrow rendering—not a false 1:1 desktop screenshot—is the final browser evidence.

**Findings**

- No actionable P0/P1/P2 issue remains in the implemented task shell at the available browser viewport. The responsive version preserves the fixed hierarchy: pure full-screen color, wordmark, five-node trail, one central panel and the two generated IP guides. It intentionally scrolls vertically on a narrow portrait browser so controls remain reachable.
- The selected artwork uses a different orange task/color example from the purple conversation route; this is intentional category theming. The same panel structure, scale relationship, white wordmark and small companion placement are retained.

**Required fidelity surfaces**

- Fonts and typography: TEST! remains the supplied source-derived canvas, not an approximate font. DM Sans is used for readable Chinese task copy, with the task title, response areas and primary action retaining a compact hierarchy.
- Spacing and layout: desktop rules use a 66.8vw central panel and separate header corners; narrow screens swap to one full-width panel with all task controls in document flow. A compact-height pass reduces options, padding and action height so a 16:9 desktop surface does not clip the primary control.
- Colors and tokens: blue, green, violet and orange are solid full-page category tokens; panel surfaces stay white, with only pale category tints inside interactive states. No dark canvas, sidebar or additional dashboard cards were introduced.
- Image quality and asset fidelity: `public/assets/assessment-guides-crop.png` is a generated original line-art guide pair with its chroma backdrop removed; it is a real local raster asset, not CSS/SVG art. The paired characters retain sharp white outlines at their intended small scale.
- Copy and content: all four modes have coherent Chinese prompts. Blue comprehensive assessment runs objective → conversation → Agent tasks across five levels, rather than reverting to a static three-icon summary.

**Interaction checks**

- The selection cards open their own map routes. A map level opens its corresponding task and returns to the map with the next level unlocked after completion.
- Browser check: a conversation reply was entered and sent; “确认下一关” became enabled; completing it returned to `#assessment/conversation` and unlocked level four.
- Browser check: selecting an objective answer enabled “提交答案”; entering an Agent instruction enabled “运行并继续”.
- Browser runtime logs stopped adding errors after the React key-prop warning was corrected.

**Implementation checklist**

- [x] Five-stage maps for all four assessment types
- [x] Working objective, conversation and practical interaction states
- [x] Blue comprehensive route mixes all three interaction modes
- [x] Original local IP artwork and reduced-motion-safe entrance motion
- [x] Production build and automated regression suite

final result: passed

## Latest revision: case startup, buffering, and full-bleed media

Scope: make the first homepage reveal wait for the three initially visible real cases; remove the pixel pirate from every carousel group; retain the prior frame while any replacement is still warming; and remove Wing It/Mario letterboxing inside the cube displays.

Implementation checks: the initial screen IDs are collected from the first three face configurations. The home canvas remains visually withheld until every one reports a decoded video frame or two rendered scene frames. Only then does the next group mount as a preload. The existing two-layer buffer continues to keep the shown layer above a pending layer until readiness, including a recoverable error state. Wing It now uses `object-fit: cover`; Mario's showcase canvas is a full-viewport cover surface. The manifest contains four cases only, without `pirate-pixel`.

Verification: production compilation passed. The complete automated suite passed (45 tests), including new checks for four-case rotation, boot-gated preload ordering, and the two full-bleed media rules. No browser visual run was requested for this performance-focused update; runtime frame timing and network throughput remain device-dependent and are not claimed as benchmarked.

## Latest revision: demo login form inside the front screen

Implementation checks: passed. This scoped form addition was checked through rendered markup, submission-unit tests, routing source checks and production compilation; no new browser visual QA was performed in this pass. Earlier screenshot comparisons below describe the preceding shell/rotation revisions, not a screenshot-verified form.

Scope: account and password inputs, show/hide password, and a login submit button in the pale-pink front display. The form mounts only when rotation has settled. Blank input is accepted, native validation is disabled, and submission clears the fields and enters the existing TEST! assessment screen. No request, credential read, credential storage, or authentication was added. Existing source materials, 900ms turn, preloaded cases and assessment artwork remain unchanged.

Layout: the form cancels the screen canvas's horizontal/vertical scale to preserve native 16px text and 44px inputs/button. The screen slot is 461.39 × 393.42 CSS px on desktop, 276.84 × 236.05 at 390 × 844, and 219.16 × 186.88 at 320 × 568. Container-size rules compact spacing and secondary copy; very short landscape slots scroll internally rather than hiding controls. Keyboard submission uses a native form; account/password have accessible labels and password visibility has a labeled toggle. Navigation focuses the assessment heading after submit, and the hidden cube stays flat/paused until returning home.

Checks: server-rendered form markup, empty submission, reset-before-navigation ordering, absence of credential reads/storage/network code, inverse scaling at five sizes, and connection to the existing assessment route. Existing tests retained. Final build and all 40 tests passed. The established local preview/hosting configuration is preserved; no publication or backend changes were requested or performed.

## Historical revision: fast cube-to-plane entry and preloaded cases

final result: passed

Latest scope supersedes the earlier direct login-to-assessment route: delete the content-editing Studio and its entry points; turn the existing cube into one front-facing surface before any future login UI. Do not add the form yet. User then requested faster/smoother motion, better corners, pale-pink faces with all case animation stopped at the start, and next-case preloading without black transitions.

Implementation: original shell photo is unprojected into three material maps and follows shared, calibrated yaw/pitch geometry. Start screen coordinates remain exactly the original reference. At completion only the right face has projected area and its inner screen is axis-aligned. Moving/centering share a 900ms cubic ease-out; inactive face content is hidden immediately and both visible media and staged media are paused. Source silhouette alpha removes background wedges; lower corner calibration excludes the photographed base fragment, and the final face has rounded clipping. No new login fields or authentication added; TEST! assessment page is retained separately.

Evidence: `../../work/cube-front-reloaded.png` documents the initial front-facing implementation; `../../work/cube-turn-fast-start.png` captures the latest normal-speed turn at progress 0.1052, with three pale-pink faces and no playing media. `../../work/cube-front-final.png` captures the refined material/blank-screen result; `../../work/cube-flat-phone.png` is the mobile check. Latest startup check read all six content layers playing=false, video paused=true, and all three screen backgrounds RGB(251,225,236). End check: progress=1, only right visible, route=login, busy=false. Return: progress=0, video resumes from its retained time, and three visible cases restore.

Corner/geometry verification: tests check all shared edges at 101 progress samples, source-coordinate equality, material-map round trips, final axis alignment and centered/in-bounds panel sizes. No opening between faces is introduced by their movement. Shading is still source-photo shading, not physically relit 3D; minor material lighting variation is a P3 limit, not a seam.

Case preloading: each face uses a two-layer buffer. Staged scenes render two real frames and then pause; staged video decodes and stays paused. On readiness the current frame crossfades with the prepared frame over 200ms, then the old layer is released. Unprepared manual jumps keep the current content until the requested frame exists. Readiness acknowledgements validate the sending iframe. Tests cover preload/current/crossfade/manual-jump layer selection and a two-layer cap. The original 15-second showcase cadence is unchanged.

Browser checks: all next-layer ready flags were true before switching; Wing It/Mario/conbini switched to Mario/conbini/pirate, then to conbini/pirate/pixel with zero visible loading overlays. Current video readyState=4 and playing; staged video readyState=4, paused at time 0. Root case-layer count stays at six. Studio markup/triggers are absent. Source case files remain unchanged outside the scoped embed bridge.

Visual comparison: source-based rest geometry and material continuity were reviewed with the supplied cube art and the existing home/turn captures. Intentional differences are removed editing triggers and pale-pink content during login rotation. The in-app browser's 1.9 capture scaling persisted intermittently; affected screenshots are detail evidence, not standalone pixel-identical/fullscreen claims. Actual DOM measurements at CSS 1536 × 1024 give cube transform identity and right-screen bounds matching the original reference. Source/header type and home layout were not redesigned. The earlier stable DPR-1 source comparisons remain applicable at rest.

Final build and all 36 tests passed. No browser console warnings/errors observed during the case/rotation verification. No remaining P0/P1/P2 issue found in this scoped pass. Full cross-browser/real-device frame-time benchmarking is not claimed. Preview remains local; no deployment.

Final combined comparison inputs: `../../work/cube-home-source-comparison.png` places original reference and final resting homepage side by side at the same 1536 × 1024 CSS layout, normalized to 808 × 539 image pixels to match the browser capture's 1.9 scaling. Shell position, screen corners and source lettering align; copy, cases, deleted statistics/editor stars intentionally differ. `../../work/cube-front-corner-comparison.png` compares the earlier front material against the refined pale-pink front at matching face size, confirming removal of the protruding base fragment and a continuous rounded edge. Both combined images were opened and inspected. Phone final DOM at 390 × 844: panel x=27,y=305.45,w=336,h=283.73, page dimensions exactly equal viewport, progress=1; no clipping or overflow. The final source archive includes these code changes, not browser debug flags in the preview URL.

## Historical revision: assessment screen, TEST! wordmark, card-aligned transition

final result: passed

Scope: add the user-requested second screen, replace its old heading with the latest supplied TEST! art, and refine the three-band transition so no horizontal seam crosses an assessment card. Existing homepage, real cases and independently editable displays remain intact.

Source truth: `public/assets/assessment-reference.png` (1672 × 941), `public/assets/test-wordmark-reference.png` (1862 × 845), and the explicit follow-up to keep the whole card row intact. Final desktop evidence: `../aiquos-assessment-preview.png`. Focused source/prototype comparisons inspected together: `../../work/assessment-type-comparison.png` and `../../work/test-wordmark-comparison.png`. TEST! retains the supplied letter contours, proportions and spacing; only the dark matte is removed. It is source artwork, not an installable font.

Required fidelity surfaces:
- Typography/assets: the four source illustrations and original Chinese/English labels remain unchanged. TEST! is a transparent, source-derived 822 × 244 canvas fitted proportionally into a 633.344 × 188 desktop slot. No approximate lettering or replacement illustrations.
- Spacing/layout: at 1672 × 941, card rectangles exactly match source coordinates: (81,343,363,420), (465,343,355,420), (841,343,357,420), (1220,343,363,420). Heading y=122 to 310; document equals viewport. Phone uses a two-column grid, as no phone reference was supplied.
- Colors/surfaces: source card lighting retained; near-black page, quiet return control, subtle hover/focus/selected states. Browser capture color conversion and simplified background grain remain minor P3 fidelity limitations.
- Content/behavior: login is a prototype navigation control, not authentication. All four cards support real single-selection state and accessible labels; questions and scoring remain out of scope.

Iterations and corrections:
1. Initial desktop card positioning was several pixels off. Restored exact source widths and gaps and shifted the grid to the source anchor. Original card typography preserved through source image crops.
2. Latest user feedback: equal-height transition thirds cut through the assessment cards (P2). Removed equal-third cuts. Both seams are now measured from the whitespace around the entire card group. At reference size they are y=326.5 and y=779.5, leaving the full y=343–763 card row in the middle band. Incoming and outgoing pages share these cuts; return uses the same assessment geometry before hiding it.
3. Phone verification at actual CSS viewport 390 × 844: TEST! rectangle x=46.80,y=106,w=296.40,h=87.98; cards span y=225.97–626.58 in two rows. Measured seams y=209.97 and 642.58 preserve both rows. Document dimensions 390 × 844, no overflow.

Transition verification: `../../work/assessment-card-aligned-return.png` and `../../work/assessment-card-aligned-phone-transition.png` capture real in-progress movement in development-only slow preview. DOM inspection confirmed six visual strips, identical incoming/outgoing clip boundaries, top/bottom traveling together and middle traveling oppositely. Desktop inspection at the later zoomed CSS viewport 880 × 495 found seams 171.842 and 410.263, surrounding card bounds 180.526–401.579. Phone inspection confirmed middle clip inset(209.971px 0px 201.422px). No card crosses either seam. Source canvas/video frames and explicitly returned WebGL snapshots are copied; animation does not create live duplicate game frames.

Capture limitation: the in-app browser changed to 1.9 device scale during this pass. Later captures include a scaled composition inside the output buffer; these are used only to inspect seam continuity, not as pixel-alignment/fullscreen evidence. The stable DPR-1 desktop capture and live DOM measurements above are the layout evidence. The focused TEST comparison shows no matte rectangle or distorted glyphs.

Checks: normal login and return, selected-card state, focus restoration, cleanup of transition overlays, pause of hidden homepage media, direct assessment entry, phone layout and reference layout. Reduced-motion skips movement. Resize finishes running strips; repeated navigation is locked. Production build and all 28 tests passed, including explicit desktop/phone seam safety cases. Final normal-speed browser check has no warnings/errors. Preview query and viewport override reset for handoff. No deployment performed.

No remaining actionable P0/P1/P2 findings for this scope. Extremely short windows may scroll; visible card content stays in the middle band and offscreen bands can collapse at viewport edges. Full cross-browser/assistive-technology and real-device GPU audits were not performed.

## Historical revision: AI capability positioning and quieter case labels

User scope: update left-side copy to describe an AI-usage ability testing website; retain the useful title/description on each screen but make it less visually intrusive. No assessment/scoring implementation was requested.

Source truth for this scoped pass: `../../work/copy-captions-before.png`, the existing prototype immediately before the edit, plus the user's requested changes. Implementation evidence: `../../work/copy-captions-desktop.png` (also copied to `../aiquos-preview-refined.png`). Both are 1536 × 1024 screenshot pixels at the same CSS viewport / DPR 1, first case selected and rotation paused. They were opened together for full-view comparison; live video/game frames naturally differ in time. Focused comparison: `../../work/copy-captions-detail.png`, aligned 610 × 165 crops stacked before / after, opened and inspected.

Required surfaces:
- Typography: new Chinese three-line hero retains the existing 42px/600 hierarchy, with adjusted line height and spacing; concise 17px supporting text. Phone headline 30px and supporting text 12px remain separated from the right controls.
- Layout: original wordmark, cube geometry, viewport anchoring, navigation and carousel unchanged. Labels are content-width (121–177px in the first case) instead of spanning 460–600px. Existing in-screen lower-left position retained.
- Colors: no status dot or border; backing opacity reduced from 85% to 30% with a localized blurred/dimmed backdrop and subtle text shadow. White titles remain identifiable without the full-width black stripe.
- Assets: original case video, game and 3D scenes untouched; no new artwork introduced, and a larger part of each case is visible.
- Copy: hero now says “AI 时代，你的实力到哪一步？” and describes real tasks, prompting and creating finished work. CTA “探索案例” starts the real case carousel; no false claim of a working test or score.

Responsive/interaction evidence: `../../work/copy-captions-phone.png`, 390 × 844. Document equals viewport; copy x=27.3 to 207.3, right-side stars x=323 to 365; copy/CTA bottom 753.7. No overlap or scroll. CTA tested: first case selected, rotation running, no editor dialog opened. Existing audio control retained with keyboard focus and hover feedback. Console check returned no errors/warnings. Production build and all 22 tests passed.

Findings: no actionable P0/P1/P2 issues from this comparison. No further visual iteration required. Historical body-font and simplified background-lighting P3s are unchanged. Real assessment flow/scoring remains outside this edit. Browser viewport override reset and running preview retained.

Latest copy/caption revision final result: passed

## Historical revision: real case carousel, statistics removed

Scope: remove the entire 50k+/120+/98% footer and 10k+ social-proof block; rotate the user's actual case projects across the cube. Preserve the previously verified viewport layout, source wordmark, product shell and independent content editor. This section supersedes the historical checks below wherever the intentional content changes differ.

Source visual truth: `public/assets/aiquos-reference.png` (1536 × 1024), plus the user's explicit deletions and real-case replacement instructions. Implementation: `http://127.0.0.1:4286/`. Final capture: `../aiquos-preview-cases.png`, 1536 × 1024 pixels / CSS viewport, DPR 1. Source and final screenshot were opened in the same comparison input. Screen content is intentionally different; shell and surrounding design were compared at identical coordinates, not judged as missing original widgets.

### Findings and iterations

1. `../../work/cases-desktop-a.png`: P1, Mario showcase controller referenced a nonexistent collision helper, preventing animation updates. Fixed to use the original game's `tileSolid` helper. Post-fix `cases-desktop-b.png` visibly shows Mario jumping, scrolling scenery and the timer advancing; final screenshot confirms later scenery. Console's retained errors end at 07:18:37 UTC before the correction/reload, with no subsequent errors observed through final verification.
2. Same initial capture: P2, the source-derived shadow patch included the old raster carousel dots, leaving ghost dots above the new controls. Trimmed the patch to end at the cube base. `cases-desktop-b.png` and final capture show only the new five-dot carousel.
3. Mobile controls require more space than the former four dots: reserved 88 px below the cube before placing the copy. `../../work/cases-phone.png` at 390 × 844 confirms carousel bottom 534.75, copy top 543.75, copy/CTA bottom 746.53. Document and viewport are both 390 × 844 with no overflow or overlap.

Final full-view comparison: source alongside `../aiquos-preview-cases.png`; focused side-by-side comparison: `../../work/cases-cube-comparison.png` (two aligned 650 × 600 crops, source left / implementation right). Screen borders, shell lighting and perspective remain aligned. No actionable P0/P1/P2 findings remain.

### Required fidelity surfaces

- Typography: original source-derived AIQUOS contours and locally bundled DM Sans preserved. Case labels use compact readable weights; the new carousel uses quieter typography below the cube.
- Spacing/layout: deleted components leave no blank cards. Cube, wordmark, copy and navigation retain their reference anchors. Carousel replaces the prior dots only. Phone and 1920 × 1080 desktop checked (`../../work/cases-wide.png`); both fill their viewports.
- Colors/tokens: existing pink/white/black palette and original shell accents retained. Dark overlays belong to the dynamic case displays only. Historical P3 simplified background lighting remains unchanged.
- Image/asset quality: actual 1080p Wing It finished clip, original Mario scripts, conbini v2 and two original pirate scene variants; no fake screenshots or substituted illustrations. Video preserves its full frame; top case canvas is 640 × 360 before projection. Scene iframe rendering uses its own aspect-aware camera.
- Copy/content: all four requested marketing numbers removed from the DOM. Five real cases named accurately. Conbini v1 is mentioned in the source collection notes but absent on disk; only existing v2 is included. Controls distinguish pausing the carousel from stopping the playing case animations.

### Verified interactions and checks

- Every one of five cases appears across the three screens; all groups use three distinct cases.
- Automatic rotation advances every 15 seconds and wraps through index 4 back to earlier indices; manually selecting a dot and using the next arrow both update the content. Pause retains the selected case for longer than one interval.
- Video readyState 4 / paused false; playback time advanced. Audio button changes muted false and back to true; final playback muted.
- `cases-pirates.png` confirms conbini plus both ordinary and pixelated pirate scenes render simultaneously. These are live WebGL scenes, not stills.
- Top screen independently replaced by focus clock via phone editor; side cases remained. Custom state persisted beyond one carousel interval and across resize to 1920 × 1080. Resume restores case playback.
- Reduced-motion preference disables automatic rotation initially. Hidden document or open modal suspends the rotation timer. Embedded scene rendering capped at 30 fps, 1× density; old frames unload on switch.
- Scene copies are sandboxed with only `allow-scripts`. Conbini is bundled to classic JavaScript so it runs without allowing same-origin access or network dependencies. Original source collection is untouched.
- Production build passed. All 22 tests passed: 3 case tests, 15 responsive/reference tests, 4 packaged-worker tests.
- Preview viewport override reset and normal automatic playback restored before handoff. No deployment performed.

Limits: this is an automatic showcase; game/scene iframe inputs are intentionally disabled inside the small projected screens. The existing editor can still load arbitrary media or live widgets. 15-second rotation previews a segment of the 114-second video; pause rotation to watch it continuously. No real-device GPU benchmark or full cross-browser audit was performed.

Latest cases revision final result: passed

## Historical revision: adaptive full-viewport layout

User feedback: the fixed-ratio page left unused margins and did not fill the browser. The previous fixed composition is no longer the responsive implementation.

Fixed: `.design-canvas` now matches viewport width and at least viewport height. Navigation, copy, footer and controls are anchored independently. The source wordmark and complete cube (including all three projected DOM screens) use separate uniform scales. The original narrow rounded page margins remain intentional; letterbox bands are removed. The edit is limited to layout, preserving existing artwork, colors, fonts, text and editor capabilities.

Source for this scoped comparison: `../aiquos-preview.png`, the prior 1536 × 1024 implementation. New reference-size screenshot: `../aiquos-preview-fullscreen.png`, 1536 × 1024 pixels at a 1536 × 1024 CSS viewport and DPR 1. Both were opened in the same comparison input. The wordmark and cube retain the exact reference coordinates (also asserted by an automated test); navigation and footer are now viewport-centered. All five fidelity surfaces reviewed: typography unchanged, layout intentionally responsive, color tokens unchanged, source image assets unchanged and unstretched, copy unchanged. No new P0/P1/P2 differences.

Additional browser evidence in `../../work/`:
- `fullscreen-before.png`: original page at the app's narrow viewport.
- `fullscreen-1440-initial.png`: 1440 × 900; canvas exactly fills viewport, pink frame x=11 through x=1429, y=8 through y=890.
- `fullscreen-phone.png`: 390 × 844; canvas and document height both 844; copy bottom 747.53, footer top 756. No overlap or scrolling at this size.
- `fullscreen-1920.png`: 1920 × 1080; document dimensions exactly match viewport, frame reaches both sides with 11px margins.
- `fullscreen-ultrawide.png`: ultrawide interaction state. DOM verified a 2560 × 1080 canvas and frame ending at x=2549; screenshot capture was width-limited, so use the complete wide-screen capture for full boundary comparison.
- `fullscreen-2048.png`: complete 2048 × 900 ultrawide capture; both outer edges, top CTA, screen shortcuts, arrow and footer are visible. Document/client width and stage width are 2048. This closes the width-limited screenshot gap above.

Iteration: initial compact-height calculation would crowd the footer at short heights. Reserved space for the copy and footer before sizing the cube. The browser 390 × 844 capture confirms separation; deterministic assertions cover 14 viewport sizes including short screens, tablets, laptops, desktop and ultrawide widths. Very short viewports intentionally scroll at a 760px compact / 680px landscape minimum height rather than shrinking text or hiding controls.

Regression checks: editor opened, top screen changed to the focus clock, timer started and remained running across a resize from 1920 to 2560 wide. Reset restores the original preset. Browser console has no unexpected warnings/errors. Production build succeeds; all 19 tests pass (15 layout/reference tests plus 4 packaged-worker tests).

New layout implementation: `src/layout.js` and `src/responsive.css`. Page-wide transform removed; responsive rules imported after appearance styles. The user's full-viewport preference is recorded in `AGENTS.md`.

Latest revision final result: passed

Source: public/assets/aiquos-reference.png, 1536 × 1024.
Initial implementation capture: ../../work/desktop-initial.png.
Browser screenshot: 1536 × 1024 output; browser density 1.9, logical viewport 808 × 539. Page scales proportionally to reference; recapture with exact logical viewport for final pass.

Initial findings:
- P2: pink matte around source typography is visible; replace matte with source-derived transparent lettering.
- P2: U/A letter edges were clipped by coarse asset boundary; retain exact source pixels.
- P2: star badge background is too cream; use a white translucent surface.
- P2: original screen remains visible near the top edge of custom top content; refine plane corners.
- P3: font metrics and footer icon shapes differ slightly from source.

Core behavior initial pass: four presets switch all faces successfully; each face is a separately projected DOM surface.

## Final comparison — 2026-09-03

Source visual truth: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/outputs/aiquos/public/assets/aiquos-reference.png`.

Final implementation: `http://127.0.0.1:4286/`.

Final screenshot: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/outputs/aiquos-preview.png`.

Viewport and normalization: 1536 × 1024 CSS px, devicePixelRatio 1, 1536 × 1024 screenshot pixels. Reference also 1536 × 1024. Canvas bounding rectangle explicitly checked as x=0, y=0, width=1536, height=1024. Original preset, no modal, no hovered screen.

Full-view evidence: reference and final implementation were opened together in the same comparison input. Composition, cube position, six letter contours, foreground hierarchy, copy and primary control placement align. No remaining P0/P1/P2 issues.

Focused evidence (source above implementation, aligned crops):
- `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/brand-comparison.png`
- `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/cube-comparison.png`
- Custom screens: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/widgets-verified.png`
- Media replacement: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/media-proof.png`
- Mobile cold-load viewport: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/mobile-cold-visible.png`
- Mobile lower content: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/mobile-bottom.png`
- Mobile editor: `/Users/lunaecho/Documents/Codex/2026-09-03/wo/work/mobile-editor.png`

## Comparison history and fixes

1. Initial `desktop-initial.png`: P2 matte seams around lettering, cropped A/U edges, cream badge fills and custom top screen bleed. Fixed by source-derived alpha unmixing, white translucent badges, revised screen corner coordinates, footer alignment and CTA spacing.
2. `desktop-second.png`: letter contours corrected; viewport density/resize transition was not yet stable. This image was excluded from the final fidelity verdict. Browser eventually settled to DPR 1 and exact reference CSS dimensions.
3. `desktop-verified.png` and focused comparisons: exact source letter/cube structure confirmed. Repeating background lighting was visible after source-tile reuse; removed low-frequency lighting from the tile, retaining only subtle source grain. Top-face bleed resolved in `widgets-verified.png`.
4. Mobile 390 px: page initially used the full inner width, including the browser scrollbar. Fixed by measuring document client width and observing viewport changes. Cold-load check confirmed client width 375, app width 375, projected canvas width 375, scroll width 375; all controls remain available. Final mobile screenshots are responsive adaptations because no mobile reference was supplied.
5. Final cold-load desktop `aiquos-preview.png`: no matte boundaries, no clipping, stable typography, default screens and complete layout. No further visual changes after this capture.

## Required fidelity surfaces

- **Fonts / typography:** supplied custom AIQUOS letterforms retained through pixel-derived alpha, including original arch and kerning. Actual body and control text use locally bundled DM Sans. P3: source font was not provided; subtle body glyph / weight differences remain. No claim of a full installable AIQUOS font.
- **Spacing / layout:** reference-sized canvas and measured positioning verified. Cube artwork and each independent screen share one coordinate system. Header, left copy, CTA, stars, dots and footer retain reference hierarchy. Mobile layout preserves content without horizontal clipping.
- **Colors / tokens:** source pink sampled around RGB 245,107,163. Cube's original three color families and shell lighting are retained. P3: background lighting/grain is simplified and browser screenshot color handling differs slightly from source.
- **Image quality:** real supplied artwork is reused, not replaced with generated approximations or hand-drawn stand-ins. The white brand is source-derived. Product artwork is cropped to the shell and original screens; surrounding page copy and controls are live HTML. Original raster resolution limits extreme enlargement. Custom screen geometry is functional interface projection, not a replacement illustration.
- **Copy / content:** original hero, navigation, CTAs and statistics retained. Editor copy clearly explains local-only uploads. About and Pricing disclose that this is a frontend demo, not a functioning paid AI service.
- **Icons:** Phosphor library provides real icon components. P3: footer group/cube/bolt glyphs are close but not pixel-identical to reference art.

## Verified interactions

- All four preset buttons and next arrow switch screen configurations.
- Each face opens the editor; three face selectors independently apply a widget.
- Local PNG file loaded on left screen (naturalWidth=1536, complete=true).
- Local MP4 loaded on right screen while left image and top original remain unchanged; readyState=4, paused=false, playback time advanced, videoWidth=500.
- Fixed cached-image loading-label race; media instances are keyed by type and source.
- Timer start changes to pause state; progress changes from 78 to 79 with keyboard input; sound starts and changes to pause state.
- Modal close, focus return, keyboard controls and mobile editor checked. Native dialog handles focus trapping and Escape.
- Reset returns all screens to original. Manual edits clear the preset-selected state.
- Object URLs are revoked when no longer used and on unmount.
- Three projection matrices map all twelve screen corners to their specified destination coordinates within 1e-8 px in a deterministic arithmetic check.
- Browser console: no unexpected warnings or errors observed.
- Production build successful; all four packaged-worker tests passed.

## Limits and follow-up polish

This is a fixed-view 2.5D implementation, not a rotatable 3D mesh. Arbitrary React components are supported by the component contract; no backend integration was requested. Uploads are session-local. Remote-media behavior and codecs depend on source servers and browser support; not every external format was tested. Full browser-matrix and assistive-technology audits were not performed.

Residual P3s: exact body font identification, pixel-identical small footer glyphs, and original low-frequency background illumination. These do not block the functioning recreation; avoid claiming mathematically pixel-identical output.

## Implementation checklist

- [x] Custom source-based brand first
- [x] Original product shell and three independently replaceable DOM screens
- [x] Images, videos and interactive components
- [x] Responsive layout, keyboard focus and reduced-motion support
- [x] Source / browser comparisons, focused brand and cube checks
- [x] Build, packaging tests and source documentation
