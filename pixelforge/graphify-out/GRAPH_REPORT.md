# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-25)

## Corpus Check
- 1611 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1611 nodes · 3009 edges · 54 communities detected
- Extraction: 62% EXTRACTED · 38% INFERRED · 0% AMBIGUOUS · INFERRED: 1144 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Animation Service|Animation Service]]
- [[_COMMUNITY_Canvas Service Core (frames PX-090..103)|Canvas Service Core (frames PX-090..103)]]
- [[_COMMUNITY_Project Models & Routes|Project Models & Routes]]
- [[_COMMUNITY_Seed & Migrations|Seed & Migrations]]
- [[_COMMUNITY_Brand Kit Service|Brand Kit Service]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_ApiService|ApiService]]
- [[_COMMUNITY_Auth Core + Profile|Auth Core + Profile]]
- [[_COMMUNITY_Editor (PX-072..103)|Editor (PX-072..103)]]
- [[_COMMUNITY_AI Background Service|AI Background Service]]
- [[_COMMUNITY_Database + FastAPI Bootstrap|Database + FastAPI Bootstrap]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Font Service|Font Service]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Dashboard|Dashboard]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Template Authoring|Template Authoring]]
- [[_COMMUNITY_Brand Kit Apply (PX-060)|Brand Kit Apply (PX-060)]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Gallery + Auth Interceptor|Gallery + Auth Interceptor]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Auth Page|Auth Page]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Hub|Hub]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 83 edges
2. `Editor` - 58 edges
3. `SidebarDrawerComponent` - 49 edges
4. `PropertyPanelComponent` - 47 edges
5. `TextToolbarComponent` - 45 edges
6. `Dashboard` - 33 edges
7. `ApiService` - 30 edges
8. `Canvas` - 28 edges
9. `Canvas` - 25 edges
10. `ProjectService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Angular CLI` --conceptually_related_to--> `App Root Template (Angular placeholder)`  [INFERRED]
  README.md → src/app/app.html
- `Delete every document matching ``filter``. Return is Motor-specific.` --uses--> `Template`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/seed/templates_seed.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/schemas/template.py
- `Pixelforge Project` --rationale_for--> `Positioning: Free Canva alternative with AI tools`  [EXTRACTED]
  README.md → src/index.html
- `PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient)` --semantically_similar_to--> `PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient)`  [INFERRED] [semantically similar]
  public/icons/icon-512x512.png → public/icons/icon-384x384.png
- `PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient)` --semantically_similar_to--> `PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient)`  [INFERRED] [semantically similar]
  public/icons/icon-512x512.png → public/icons/icon-96x96.png

## Communities

### Community 0 - "Animation Service"
Cohesion: 0.03
Nodes (9): AnimationService, ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, FabricObject, ImageFiltersPanelComponent, PropertyPanelComponent, QuickActionBar (+1 more)

### Community 1 - "Canvas Service Core (frames PX-090..103)"
Cohesion: 0.03
Nodes (7): CanvasService, Canvas, LayerPanelComponent, ResizeDialog, StyleVariationsService, TemplateService, ThemeService

### Community 2 - "Project Models & Routes"
Cohesion: 0.03
Nodes (11): BackgroundPanelComponent, Editor, setup(), StaticCanvas, templateFactory(), HistoryService, KeyboardService, normalizeHex() (+3 more)

### Community 3 - "Seed & Migrations"
Cohesion: 0.04
Nodes (89): ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate (+81 more)

### Community 4 - "Brand Kit Service"
Cohesion: 0.03
Nodes (77): _infer_platform(), migrate(), Migration 0001 — backfill the ``platform`` field on legacy project rows.  Backgr, Reverse-lookup the platform id that matches ``width`` × ``height``.      Args:, # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse, Backfill ``platform`` on every project row that lacks it.      Args:         db:, Protocol, PaletteSlot (+69 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (6): ApiService, BrandKitApplyService, CommentsOverlay, CommentsService, ShareDialog, VersionsDialog

### Community 6 - "ApiService"
Cohesion: 0.07
Nodes (71): AuthResponse, create_token(), decode_token(), get_current_user(), hash_password(), PasswordChange, Requires authenticated user or raises 401., Partial-update payload for the authenticated user's own profile.      Fields def (+63 more)

### Community 7 - "Auth Core + Profile"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 8 - "Editor (PX-072..103)"
Cohesion: 0.04
Nodes (4): AiBackgroundService, AiDesignService, DesignHelperService, SidebarDrawerComponent

### Community 9 - "AI Background Service"
Cohesion: 0.05
Nodes (2): Dashboard, ProjectService

### Community 10 - "Database + FastAPI Bootstrap"
Cohesion: 0.05
Nodes (45): _png_bytes(), Happy-path coverage for auth_routes endpoints after the Depends refactor., Render a tiny valid PNG via Pillow for avatar-upload tests., POST /api/auth/me/password rotates the password (PX-075)., Wrong ``current`` is rejected with 401 (PX-075)., ``next`` shorter than 6 chars is rejected with 400 (PX-075)., ``next`` identical to ``current`` is rejected (PX-075)., POST /api/auth/me/password without a token returns 401 (PX-075). (+37 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (33): close_db(), connect_db(), get_db(), is_connected(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, Return the MongoDB database handle.      Raises a clear error if the DB is not c, lifespan(), FastAPI lifespan: open/close Mongo and optionally seed starter templates.      A (+25 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (4): CanvasRulersComponent, CollaborationService, CommandPalette, NewProjectDialog

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (4): AuthComponent, AuthService, ProfileComponent, UserMenuComponent

### Community 14 - "Font Service"
Cohesion: 0.11
Nodes (3): ExportDialog, ExportService, getPlatformPreset()

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (20): ActiveSelection, bootstrap(), Circle, FabricImage, FabricText, Group, IText, Line (+12 more)

### Community 16 - "Dashboard"
Cohesion: 0.13
Nodes (3): AccessibilityService, AuditDialog, QualityScoreService

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (2): AlignmentPanelComponent, GradientPanelComponent

### Community 18 - "Community 18"
Cohesion: 0.1
Nodes (22): Angular Logo SVG, Angular @for control flow block, Pill link group (Angular docs links), App Root Template (Angular placeholder), router-outlet, title() signal binding, app-root mount point, Positioning: Free Canva alternative with AI tools (+14 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 20 - "Template Authoring"
Cohesion: 0.2
Nodes (5): BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg()

### Community 21 - "Brand Kit Apply (PX-060)"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (4): authInterceptor(), emptyCanvasFor(), GalleryComponent, PresentationMode

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (14): delete_asset(), get_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively., Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId, Delete an asset record and its on-disk file.      Args:         asset_id: MongoD (+6 more)

### Community 24 - "Gallery + Auth Interceptor"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (13): aiofiles 24.1.0, Pixelforge Backend (Python), bcrypt 4.2.1, FastAPI 0.115.12, motor 3.7.0 (async MongoDB), onnxruntime 1.21.1, passlib[bcrypt] 1.7.4, Pillow 11.2.1 (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (12): Happy-path coverage for comments_routes endpoints after the Depends refactor., POST a comment then GET surfaces it by projectId + text., # NOTE: list_comments re-derives ``id`` from ``_id`` when Mongo auto-assigns, PATCH toggles resolved flag., DELETE removes the comment., POST /{id}/replies appends a reply., GET /api/projects/{pid}/comments returns [] when none exist., test_add_reply() (+4 more)

### Community 27 - "Auth Page"
Cohesion: 0.2
Nodes (11): _parse_frontend_presets(), Parity guard: the FE and BE platform-preset lists must stay in sync.  ARD §7.1 m, The FE constants file must exist at the canonical path., FE and BE must declare the same number of presets., Every (id, label, width, height, aspect) tuple must match position-for-position., The ``custom`` preset is the user-defined sentinel at 0x0., Parse the FE TS constants file into a list of tuples.      Returns:         One, test_custom_sentinel_dimensions() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): auth_headers(), auth_token(), auth_user(), client(), mock_db(), Pytest fixtures for the pixelforge backend test harness.  This module wires an `, Return a bearer JWT for the seeded test user.      Returns:         Encoded JWT, Return an Authorization header dict for authenticated requests.      Returns: (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.26
Nodes (1): FontService

### Community 30 - "Community 30"
Cohesion: 0.42
Nodes (1): MagicWriteService

### Community 31 - "Community 31"
Cohesion: 0.2
Nodes (1): AnimationTimeline

### Community 32 - "Community 32"
Cohesion: 0.42
Nodes (1): ColorPickerComponent

### Community 33 - "Hub"
Cohesion: 0.22
Nodes (1): HubComponent

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (2): authGuard(), FakeAuthService

### Community 35 - "Community 35"
Cohesion: 0.52
Nodes (1): BackgroundRemovalService

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (5): Happy-path coverage for brand_routes endpoints after the Depends refactor., PUT /api/brand-kit persists the kit; subsequent GET returns it., GET /api/brand-kit returns an empty kit when none exists., test_get_brand_kit_empty(), test_put_brand_kit_upserts()

### Community 40 - "Community 40"
Cohesion: 0.4
Nodes (2): mkAuthResponse(), setup()

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (1): PwaInstallPrompt

### Community 42 - "Community 42"
Cohesion: 0.4
Nodes (1): PluginRegistry

### Community 43 - "Community 43"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (3): Smoke test: confirm the FastAPI test harness boots and /health answers., /health returns 200 with the expected service identifier., test_health_endpoint_returns_200()

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): GIF

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): App

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

## Knowledge Gaps
- **219 isolated node(s):** `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)`, `ng generate (scaffolding)`, `ng build` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `AI Background Service`** (60 nodes): `.createProject()`, `.getPublicTemplate()`, `.healthCheck()`, `.listPublicTemplates()`, `Dashboard`, `.clearTemplateFilters()`, `.constructor()`, `.createFromCategory()`, `.createFromPreset()`, `.createFromTemplate()`, `.deleteProject()`, `.duplicateProject()`, `.editTags()`, `.emptyTrash()`, `.filterByTag()`, `.formatDate()`, `.formatRelativeTime()`, `.generateAiDesign()`, `.getPresetIcon()`, `.goToLogin()`, `.goToTab()`, `.loadGallery()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onGalleryClick()`, `.onGallerySearch()`, `.onHomeUpload()`, `.openNewProjectDialog()`, `.permanentDelete()`, `.restoreProject()`, `.setGalleryCategory()`, `.triggerHomeUpload()`, `.useGalleryTemplate()`, `.useSuggestion()`, `.fileMakeCopy()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.updateProject()`, `.removeUpload()`, `project.service.ts`, `dashboard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (23 nodes): `AlignmentPanelComponent`, `.align()`, `.attachWhenReady()`, `.autoArrange()`, `.constructor()`, `.distribute()`, `.fixOverlaps()`, `GradientPanelComponent`, `.addStop()`, `.applyGradient()`, `.applyPreset()`, `.attachWhenReady()`, `.getPresetGradientCSS()`, `.ngOnDestroy()`, `.ngOnInit()`, `.removeStop()`, `.setAngle()`, `.setFillType()`, `.startEyedropper()`, `.updateStopColor()`, `.updateStopOffset()`, `alignment-panel.ts`, `gradient-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gallery + Auth Interceptor`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (12 nodes): `FontService`, `.constructor()`, `.fileToDataUrl()`, `.getAllFontFamilies()`, `.getGoogleFonts()`, `.loadCustomFonts()`, `.persistCustomFonts()`, `.preloadPopularFonts()`, `.registerFont()`, `.removeCustomFont()`, `.uploadCustomFont()`, `font.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (11 nodes): `MagicWriteService`, `.applySwaps()`, `.generateVariants()`, `.makeLonger()`, `.makeShorter()`, `.removeFillers()`, `.sentenceCase()`, `.titleCase()`, `.toHeadline()`, `.transform()`, `magic-write.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (11 nodes): `AnimationTimeline`, `.attachWhenReady()`, `.getAnimIcon()`, `.getAnimLabel()`, `.msToPixels()`, `.ngOnDestroy()`, `.ngOnInit()`, `.playAll()`, `.quickAddAnim()`, `.previewAnimation()`, `animation-timeline.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (10 nodes): `ColorPickerComponent`, `.commitHexInput()`, `.composeHex()`, `.emitChange()`, `.onAlphaChange()`, `.onHexChange()`, `.onHexInputChange()`, `.parseColor()`, `.value()`, `color-picker.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hub`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (7 nodes): `BackgroundRemovalService`, `.dataURLToBlob()`, `.removeBackground()`, `.removeClientSide()`, `.removeFromDataURL()`, `.removeServerSide()`, `background-removal.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (6 nodes): `btn()`, `heading()`, `mkAuthResponse()`, `pills()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (6 nodes): `PwaInstallPrompt`, `.dismiss()`, `.install()`, `.ngOnDestroy()`, `.ngOnInit()`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (5 nodes): `PluginRegistry`, `.getAll()`, `.getById()`, `.register()`, `plugin-api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `author_all()` connect `Community 19` to `Animation Service`, `Canvas Service Core (frames PX-090..103)`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `seed_templates()` connect `Brand Kit Service` to `Seed & Migrations`, `Community 11`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Brand Kit Service` to `Animation Service`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Animation Service` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Canvas Service Core (frames PX-090..103)` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Project Models & Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._