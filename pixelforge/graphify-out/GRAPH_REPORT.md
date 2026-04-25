# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-25)

## Corpus Check
- 1542 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1542 nodes · 2505 edges · 50 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 729 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Animation Service|Animation Service]]
- [[_COMMUNITY_Canvas Service Core|Canvas Service Core]]
- [[_COMMUNITY_Project Models & Routes|Project Models & Routes]]
- [[_COMMUNITY_Seed & Migrations|Seed & Migrations]]
- [[_COMMUNITY_Brand Kit Service|Brand Kit Service]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_ApiService|ApiService]]
- [[_COMMUNITY_Auth Core + Profile (PX-071075)|Auth Core + Profile (PX-071/075)]]
- [[_COMMUNITY_Editor Component (PX-072 chrome)|Editor Component (PX-072 chrome)]]
- [[_COMMUNITY_AI Background Service|AI Background Service]]
- [[_COMMUNITY_Database + FastAPI Bootstrap|Database + FastAPI Bootstrap]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Font Service|Font Service]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Dashboard Component (PX-068069)|Dashboard Component (PX-068/069)]]
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
- [[_COMMUNITY_Auth Page (PX-063)|Auth Page (PX-063)]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Hub Component (PX-064)|Hub Component (PX-064)]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 71 edges
2. `Editor` - 55 edges
3. `SidebarDrawerComponent` - 49 edges
4. `TextToolbarComponent` - 44 edges
5. `PropertyPanelComponent` - 42 edges
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
Nodes (9): AuthComponent, AuthService, BackgroundRemovalService, FabricObject, ImageFiltersPanelComponent, ProfileComponent, PropertyPanelComponent, PwaInstallPrompt (+1 more)

### Community 1 - "Canvas Service Core"
Cohesion: 0.04
Nodes (5): CanvasService, makeService(), ExportDialog, ExportService, getPlatformPreset()

### Community 2 - "Project Models & Routes"
Cohesion: 0.03
Nodes (9): AccessibilityService, AnimationService, ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, Canvas, QualityScoreService, QuickActionBar (+1 more)

### Community 3 - "Seed & Migrations"
Cohesion: 0.04
Nodes (85): ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate, Request / response Pydantic v2 models for the core project + asset APIs.  PX-060, Incoming payload for ``POST /api/projects``.      Attributes:         name: Disp, Partial update payload for ``PUT /api/projects/{id}``.      All fields are optio, List-view projection of a project document.      Excludes the heavyweight ``canv (+77 more)

### Community 4 - "Brand Kit Service"
Cohesion: 0.03
Nodes (77): _infer_platform(), migrate(), Migration 0001 — backfill the ``platform`` field on legacy project rows.  Backgr, Reverse-lookup the platform id that matches ``width`` × ``height``.      Args:, # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse, Backfill ``platform`` on every project row that lacks it.      Args:         db:, Protocol, PaletteSlot (+69 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (9): Editor, setup(), StaticCanvas, templateFactory(), KeyboardService, normalizeHex(), remapObject(), TemplateThumbnailService (+1 more)

### Community 6 - "ApiService"
Cohesion: 0.04
Nodes (7): BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg(), PluginRegistry, SidebarDrawerComponent

### Community 7 - "Auth Core + Profile (PX-071/075)"
Cohesion: 0.04
Nodes (9): AiBackgroundService, AiDesignService, ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., Dashboard, MagicWriteService (+1 more)

### Community 8 - "Editor Component (PX-072 chrome)"
Cohesion: 0.07
Nodes (64): AuthResponse, create_token(), decode_token(), get_current_user(), hash_password(), PasswordChange, Requires authenticated user or raises 401., Partial-update payload for the authenticated user's own profile.      Fields def (+56 more)

### Community 9 - "AI Background Service"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 10 - "Database + FastAPI Bootstrap"
Cohesion: 0.04
Nodes (24): AuditDialog, CommandPalette, ActiveSelection, bootstrap(), Circle, FabricImage, FabricText, Group (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (5): ApiService, BrandKitApplyService, CommentsService, ShareDialog, VersionsDialog

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (33): close_db(), connect_db(), get_db(), is_connected(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, Return the MongoDB database handle.      Raises a clear error if the DB is not c, lifespan(), FastAPI lifespan: open/close Mongo and optionally seed starter templates.      A (+25 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (4): AlignmentPanelComponent, AnimationTimeline, GradientPanelComponent, HistoryService

### Community 14 - "Font Service"
Cohesion: 0.11
Nodes (3): FontService, TemplateService, ThemeService

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (25): Happy-path coverage for auth_routes endpoints after the Depends refactor., Wrong ``current`` is rejected with 401 (PX-075)., ``next`` shorter than 6 chars is rejected with 400 (PX-075)., ``next`` identical to ``current`` is rejected (PX-075)., POST /api/auth/me/password without a token returns 401 (PX-075)., POST /api/auth/login returns a token for a previously-created user., GET /api/auth/me echoes the token's user., PATCH /api/auth/me writes the new name and returns it (PX-071). (+17 more)

### Community 16 - "Dashboard Component (PX-068/069)"
Cohesion: 0.14
Nodes (1): ProjectService

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (2): CanvasRulersComponent, CollaborationService

### Community 18 - "Community 18"
Cohesion: 0.1
Nodes (22): Angular Logo SVG, Angular @for control flow block, Pill link group (Angular docs links), App Root Template (Angular placeholder), router-outlet, title() signal binding, app-root mount point, Positioning: Free Canva alternative with AI tools (+14 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 20 - "Template Authoring"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 21 - "Brand Kit Apply (PX-060)"
Cohesion: 0.15
Nodes (1): CommentsOverlay

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

### Community 27 - "Auth Page (PX-063)"
Cohesion: 0.2
Nodes (11): _parse_frontend_presets(), Parity guard: the FE and BE platform-preset lists must stay in sync.  ARD §7.1 m, The FE constants file must exist at the canonical path., FE and BE must declare the same number of presets., Every (id, label, width, height, aspect) tuple must match position-for-position., The ``custom`` preset is the user-defined sentinel at 0x0., Parse the FE TS constants file into a list of tuples.      Returns:         One, test_custom_sentinel_dimensions() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): auth_headers(), auth_token(), auth_user(), client(), mock_db(), Pytest fixtures for the pixelforge backend test harness.  This module wires an `, Return a bearer JWT for the seeded test user.      Returns:         Encoded JWT, Return an Authorization header dict for authenticated requests.      Returns: (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (1): DesignHelperService

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (1): HubComponent

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (2): authGuard(), FakeAuthService

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 33 - "Hub Component (PX-064)"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): Happy-path coverage for brand_routes endpoints after the Depends refactor., PUT /api/brand-kit persists the kit; subsequent GET returns it., GET /api/brand-kit returns an empty kit when none exists., test_get_brand_kit_empty(), test_put_brand_kit_upserts()

### Community 36 - "Community 36"
Cohesion: 0.4
Nodes (2): mkAuthResponse(), setup()

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (1): LayerPanelComponent

### Community 38 - "Community 38"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (3): Smoke test: confirm the FastAPI test harness boots and /health answers., /health returns 200 with the expected service identifier., test_health_endpoint_returns_200()

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (1): BackgroundPanelComponent

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): GIF

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): App

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

## Knowledge Gaps
- **209 isolated node(s):** `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)`, `ng generate (scaffolding)`, `ng build` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Dashboard Component (PX-068/069)`** (25 nodes): `.healthCheck()`, `.listProjects()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.syncFromBackend()`, `.updateProject()`, `project.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (24 nodes): `.restoreVersion()`, `CanvasRulersComponent`, `.drawHorizontalRuler()`, `.drawRulers()`, `.drawVerticalRuler()`, `.getGuideScreenPos()`, `.getStep()`, `.ngAfterViewInit()`, `.ngOnDestroy()`, `.onMouseMove()`, `.onMouseUp()`, `.removeGuide()`, `.startDragGuide()`, `.startMoveGuide()`, `.toggleRulers()`, `CollaborationService`, `.connect()`, `.disconnect()`, `.send()`, `.sendCanvasUpdate()`, `.sendCursor()`, `collaboration.service.ts`, `canvas-rulers.ts`, `.restore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Kit Apply (PX-060)`** (20 nodes): `.addReply()`, `CommentsOverlay`, `.cancelNewComment()`, `.closeMention()`, `.closeThread()`, `.deleteComment()`, `.formatMentions()`, `.knownUsers()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onNewEnter()`, `.onReplyInput()`, `.onReplyKey()`, `.pickMention()`, `.screenX()`, `.screenY()`, `.submitNewComment()`, `.submitReply()`, `.toggleComment()`, `comments-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gallery + Auth Interceptor`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (9 nodes): `DesignHelperService`, `.extractColorsFromSelection()`, `.generatePalettesFrom()`, `.getFontPairings()`, `.hexToHsl()`, `.hslToHex()`, `.loadImage()`, `.rgbToHex()`, `design-helper.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (6 nodes): `btn()`, `heading()`, `mkAuthResponse()`, `pills()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (6 nodes): `LayerPanelComponent`, `.onDrop()`, `.setLayerOpacity()`, `.toggleLock()`, `.toggleVisibility()`, `layer-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `BackgroundPanelComponent`, `.onCustomColor()`, `.onModeChange()`, `background-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `seed_templates()` connect `Brand Kit Service` to `Seed & Migrations`, `Community 12`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Brand Kit Service` to `Animation Service`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `FabricObject` connect `Animation Service` to `Project Models & Routes`, `Database + FastAPI Bootstrap`, `Seed & Migrations`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Animation Service` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Canvas Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Project Models & Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._