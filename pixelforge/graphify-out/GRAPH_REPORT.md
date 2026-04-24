# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-24)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1489 nodes · 2376 edges · 56 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 651 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Animation Service|Animation Service]]
- [[_COMMUNITY_Canvas Service Core|Canvas Service Core]]
- [[_COMMUNITY_Project Models & Routes|Project Models & Routes]]
- [[_COMMUNITY_Seed & Migrations|Seed & Migrations]]
- [[_COMMUNITY_Brand Kit Service|Brand Kit Service]]
- [[_COMMUNITY_Canvas Service Tests|Canvas Service Tests]]
- [[_COMMUNITY_ApiService (main)|ApiService (main)]]
- [[_COMMUNITY_Auth Core (JWThash)|Auth Core (JWT/hash)]]
- [[_COMMUNITY_Editor Component|Editor Component]]
- [[_COMMUNITY_AI Background Service|AI Background Service]]
- [[_COMMUNITY_Database + FastAPI Bootstrap|Database + FastAPI Bootstrap]]
- [[_COMMUNITY_Audit Dialog|Audit Dialog]]
- [[_COMMUNITY_Accessibility Service|Accessibility Service]]
- [[_COMMUNITY_Editor Spec Fabric Mocks|Editor Spec Fabric Mocks]]
- [[_COMMUNITY_Font Service|Font Service]]
- [[_COMMUNITY_Alignment Panel|Alignment Panel]]
- [[_COMMUNITY_Dashboard Component|Dashboard Component]]
- [[_COMMUNITY_Editor Lifecycle|Editor Lifecycle]]
- [[_COMMUNITY_ProjectService|ProjectService]]
- [[_COMMUNITY_App Shell Template|App Shell Template]]
- [[_COMMUNITY_Template Authoring|Template Authoring]]
- [[_COMMUNITY_Brand Kit Apply (PX-060)|Brand Kit Apply (PX-060)]]
- [[_COMMUNITY_Asset Routes Tests|Asset Routes Tests]]
- [[_COMMUNITY_Comments Overlay|Comments Overlay]]
- [[_COMMUNITY_Gallery + Auth Interceptor|Gallery + Auth Interceptor]]
- [[_COMMUNITY_Asset Routes|Asset Routes]]
- [[_COMMUNITY_Export Service Spec|Export Service Spec]]
- [[_COMMUNITY_Auth Page Component|Auth Page Component]]
- [[_COMMUNITY_Backend Requirements|Backend Requirements]]
- [[_COMMUNITY_Comments Routes Tests|Comments Routes Tests]]
- [[_COMMUNITY_Platform Preset Parity Tests|Platform Preset Parity Tests]]
- [[_COMMUNITY_Pytest Conftest|Pytest Conftest]]
- [[_COMMUNITY_Auth Routes|Auth Routes]]
- [[_COMMUNITY_Hub Component|Hub Component]]
- [[_COMMUNITY_Auth Routes Tests|Auth Routes Tests]]
- [[_COMMUNITY_Background Removal Service|Background Removal Service]]
- [[_COMMUNITY_Auth Guard|Auth Guard]]
- [[_COMMUNITY_Template Thumbnail Spec|Template Thumbnail Spec]]
- [[_COMMUNITY_Platform Presets|Platform Presets]]
- [[_COMMUNITY_Brand Routes Tests|Brand Routes Tests]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]

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
Nodes (9): AnimationService, ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, StaticCanvas, ImageFiltersPanelComponent, PropertyPanelComponent, PwaInstallPrompt (+1 more)

### Community 1 - "Canvas Service Core"
Cohesion: 0.04
Nodes (5): CanvasService, makeService(), ExportDialog, ExportService, getPlatformPreset()

### Community 2 - "Project Models & Routes"
Cohesion: 0.04
Nodes (85): ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate, Request / response Pydantic v2 models for the core project + asset APIs.  PX-060, Incoming payload for ``POST /api/projects``.      Attributes:         name: Disp, Partial update payload for ``PUT /api/projects/{id}``.      All fields are optio, List-view projection of a project document.      Excludes the heavyweight ``canv (+77 more)

### Community 3 - "Seed & Migrations"
Cohesion: 0.04
Nodes (72): _infer_platform(), migrate(), Migration 0001 — backfill the ``platform`` field on legacy project rows.  Backgr, Reverse-lookup the platform id that matches ``width`` × ``height``.      Args:, # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse, Backfill ``platform`` on every project row that lacks it.      Args:         db:, Protocol, A seed starter template document, per ARD §8.1.      Validates every field the b (+64 more)

### Community 4 - "Brand Kit Service"
Cohesion: 0.04
Nodes (7): BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg(), PluginRegistry, SidebarDrawerComponent

### Community 5 - "Canvas Service Tests"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 6 - "ApiService (main)"
Cohesion: 0.04
Nodes (5): ApiService, CanvasRulersComponent, CommentsService, ShareDialog, VersionsDialog

### Community 7 - "Auth Core (JWT/hash)"
Cohesion: 0.04
Nodes (49): AuthResponse, decode_token(), get_current_user(), Returns user dict if authenticated, None otherwise (optional auth)., Requires authenticated user or raises 401., require_user(), UserLogin, UserPublic (+41 more)

### Community 8 - "Editor Component"
Cohesion: 0.05
Nodes (2): Editor, ToolbarPanelComponent

### Community 9 - "AI Background Service"
Cohesion: 0.08
Nodes (8): AiBackgroundService, AiDesignService, ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., DesignHelperService, MagicWriteService

### Community 10 - "Database + FastAPI Bootstrap"
Cohesion: 0.06
Nodes (31): close_db(), connect_db(), get_db(), is_connected(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, Return the MongoDB database handle.      Raises a clear error if the DB is not c, lifespan(), FastAPI lifespan: open/close Mongo and optionally seed starter templates.      A (+23 more)

### Community 11 - "Audit Dialog"
Cohesion: 0.07
Nodes (5): AuditDialog, CollaborationService, CommandPalette, NewProjectDialog, ResizeDialog

### Community 12 - "Accessibility Service"
Cohesion: 0.08
Nodes (4): AccessibilityService, QualityScoreService, QuickActionBar, StyleVariationsService

### Community 13 - "Editor Spec Fabric Mocks"
Cohesion: 0.06
Nodes (21): ActiveSelection, bootstrap(), Circle, FabricImage, FabricObject, FabricText, Group, IText (+13 more)

### Community 14 - "Font Service"
Cohesion: 0.11
Nodes (3): FontService, TemplateService, ThemeService

### Community 15 - "Alignment Panel"
Cohesion: 0.08
Nodes (3): AlignmentPanelComponent, AnimationTimeline, GradientPanelComponent

### Community 16 - "Dashboard Component"
Cohesion: 0.08
Nodes (1): Dashboard

### Community 17 - "Editor Lifecycle"
Cohesion: 0.08
Nodes (5): Canvas, KeyboardService, normalizeHex(), remapObject(), TemplateThumbnailService

### Community 18 - "ProjectService"
Cohesion: 0.15
Nodes (1): ProjectService

### Community 19 - "App Shell Template"
Cohesion: 0.1
Nodes (22): Angular Logo SVG, Angular @for control flow block, Pill link group (Angular docs links), App Root Template (Angular placeholder), router-outlet, title() signal binding, app-root mount point, Positioning: Free Canva alternative with AI tools (+14 more)

### Community 20 - "Template Authoring"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 21 - "Brand Kit Apply (PX-060)"
Cohesion: 0.15
Nodes (2): BrandKitApplyService, HistoryService

### Community 22 - "Asset Routes Tests"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 23 - "Comments Overlay"
Cohesion: 0.15
Nodes (1): CommentsOverlay

### Community 24 - "Gallery + Auth Interceptor"
Cohesion: 0.13
Nodes (4): authInterceptor(), emptyCanvasFor(), GalleryComponent, PresentationMode

### Community 25 - "Asset Routes"
Cohesion: 0.14
Nodes (14): delete_asset(), get_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively., Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId, Delete an asset record and its on-disk file.      Args:         asset_id: MongoD (+6 more)

### Community 26 - "Export Service Spec"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 27 - "Auth Page Component"
Cohesion: 0.16
Nodes (2): AuthComponent, AuthService

### Community 28 - "Backend Requirements"
Cohesion: 0.24
Nodes (13): aiofiles 24.1.0, Pixelforge Backend (Python), bcrypt 4.2.1, FastAPI 0.115.12, motor 3.7.0 (async MongoDB), onnxruntime 1.21.1, passlib[bcrypt] 1.7.4, Pillow 11.2.1 (+5 more)

### Community 29 - "Comments Routes Tests"
Cohesion: 0.15
Nodes (12): Happy-path coverage for comments_routes endpoints after the Depends refactor., POST a comment then GET surfaces it by projectId + text., # NOTE: list_comments re-derives ``id`` from ``_id`` when Mongo auto-assigns, PATCH toggles resolved flag., DELETE removes the comment., POST /{id}/replies appends a reply., GET /api/projects/{pid}/comments returns [] when none exist., test_add_reply() (+4 more)

### Community 30 - "Platform Preset Parity Tests"
Cohesion: 0.2
Nodes (11): _parse_frontend_presets(), Parity guard: the FE and BE platform-preset lists must stay in sync.  ARD §7.1 m, The FE constants file must exist at the canonical path., FE and BE must declare the same number of presets., Every (id, label, width, height, aspect) tuple must match position-for-position., The ``custom`` preset is the user-defined sentinel at 0x0., Parse the FE TS constants file into a list of tuples.      Returns:         One, test_custom_sentinel_dimensions() (+3 more)

### Community 31 - "Pytest Conftest"
Cohesion: 0.17
Nodes (11): auth_headers(), auth_token(), auth_user(), client(), mock_db(), Pytest fixtures for the pixelforge backend test harness.  This module wires an `, Return a bearer JWT for the seeded test user.      Returns:         Encoded JWT, Return an Authorization header dict for authenticated requests.      Returns: (+3 more)

### Community 32 - "Auth Routes"
Cohesion: 0.27
Nodes (9): get_me(), login(), Authentication endpoints: signup, login, current-user lookup., Return the authenticated caller's public user record.      Args:         db: Asy, Project an internal user document to the public-safe shape.      Args:         d, Create a new user account and return a signed JWT.      Args:         body: ``Us, Authenticate an existing user and return a signed JWT.      Args:         body:, signup() (+1 more)

### Community 33 - "Hub Component"
Cohesion: 0.22
Nodes (1): HubComponent

### Community 34 - "Auth Routes Tests"
Cohesion: 0.25
Nodes (7): Happy-path coverage for auth_routes endpoints after the Depends refactor., POST /api/auth/login returns a token for a previously-created user., GET /api/auth/me echoes the token's user., POST /api/auth/signup creates user and returns a token., test_login_with_valid_credentials(), test_me_returns_current_user(), test_signup_returns_token()

### Community 35 - "Background Removal Service"
Cohesion: 0.43
Nodes (1): BackgroundRemovalService

### Community 36 - "Auth Guard"
Cohesion: 0.29
Nodes (2): authGuard(), FakeAuthService

### Community 37 - "Template Thumbnail Spec"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 38 - "Platform Presets"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 39 - "Brand Routes Tests"
Cohesion: 0.33
Nodes (5): Happy-path coverage for brand_routes endpoints after the Depends refactor., PUT /api/brand-kit persists the kit; subsequent GET returns it., GET /api/brand-kit returns an empty kit when none exists., test_get_brand_kit_empty(), test_put_brand_kit_upserts()

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (1): LayerPanelComponent

### Community 42 - "Community 42"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (3): Smoke test: confirm the FastAPI test harness boots and /health answers., /health returns 200 with the expected service identifier., test_health_endpoint_returns_200()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (2): mkAuthResponse(), setup()

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (1): BackgroundPanelComponent

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (2): setup(), templateFactory()

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

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

## Knowledge Gaps
- **203 isolated node(s):** `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)`, `ng generate (scaffolding)`, `ng build` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Editor Component`** (58 nodes): `.getProject()`, `.publishTemplate()`, `.openProject()`, `Editor`, `.addPage()`, `.addShape()`, `.addTextWithOptions()`, `.cancelNameEdit()`, `.dataURLToBlob()`, `.deletePage()`, `.deletePageAt()`, `.deleteSelected()`, `.duplicateCurrentPage()`, `.duplicatePage()`, `.duplicatePageAt()`, `.fileNew()`, `.fitToScreen()`, `.formatTimer()`, `.goBack()`, `.handleSystemPaste()`, `.initPages()`, `.loadImageFile()`, `.maybeShowBrandKitToast()`, `.ngAfterViewInit()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onImageUpload()`, `.onKeyDown()`, `.onMouseWheel()`, `.openAuditDialog()`, `.openExportDialog()`, `.openResizeDialog()`, `.openShareDialog()`, `.openShortcutsDialog()`, `.openVersionsDialog()`, `.publishAsTemplate()`, `.redo()`, `.saveCurrentPageState()`, `.saveProject()`, `.setZoomPct()`, `.startNameEdit()`, `.startPresentation()`, `.switchToPage()`, `.toggleThirds()`, `.toggleTimer()`, `.triggerImageUpload()`, `.undo()`, `.updatePageNotes()`, `.zoomIn()`, `.zoomOut()`, `.setZoom()`, `.getCanvasState()`, `.openProject()`, `toolbar-panel.ts`, `editor.ts`, `ToolbarPanelComponent`, `.applyTemplate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Component`** (33 nodes): `.createProject()`, `.listPublicTemplates()`, `Dashboard`, `.clearTemplateFilters()`, `.constructor()`, `.createFromCategory()`, `.createFromPreset()`, `.createFromTemplate()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.filterByTag()`, `.formatDate()`, `.formatRelativeTime()`, `.generateAiDesign()`, `.getPresetIcon()`, `.goToLogin()`, `.goToTab()`, `.loadGallery()`, `.logout()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onGalleryClick()`, `.onGallerySearch()`, `.onHomeUpload()`, `.openNewProjectDialog()`, `.restoreProject()`, `.setGalleryCategory()`, `.triggerHomeUpload()`, `.useSuggestion()`, `.fileMakeCopy()`, `dashboard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ProjectService`** (24 nodes): `.healthCheck()`, `.permanentDelete()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.updateProject()`, `project.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Kit Apply (PX-060)`** (21 nodes): `.listTemplates()`, `.updateProject()`, `BrandKitApplyService`, `._buildSubstitutionMap()`, `.clearMarker()`, `._clearMarkerServerSide()`, `._revertObjectColors()`, `.revertToTemplateDefaults()`, `.finishNameEdit()`, `.toJSON()`, `HistoryService`, `.clear()`, `.init()`, `.redo()`, `.restoreState()`, `.saveState()`, `.undo()`, `.updateCounts()`, `brand-kit-apply.service.ts`, `history.service.ts`, `.getById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Comments Overlay`** (20 nodes): `.addReply()`, `CommentsOverlay`, `.cancelNewComment()`, `.closeMention()`, `.closeThread()`, `.deleteComment()`, `.formatMentions()`, `.knownUsers()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onNewEnter()`, `.onReplyInput()`, `.onReplyKey()`, `.pickMention()`, `.screenX()`, `.screenY()`, `.submitNewComment()`, `.submitReply()`, `.toggleComment()`, `comments-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Export Service Spec`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Page Component`** (14 nodes): `AuthComponent`, `.continueAsGuest()`, `.formatErrorDetail()`, `.submit()`, `.togglePasswordVisibility()`, `AuthService`, `.constructor()`, `.loadFromStorage()`, `.login()`, `.logout()`, `.setAuth()`, `.signup()`, `auth.service.ts`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hub Component`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Background Removal Service`** (8 nodes): `BackgroundRemovalService`, `.dataURLToBlob()`, `.removeBackground()`, `.removeClientSide()`, `.removeFromDataURL()`, `.removeServerSide()`, `.reset()`, `background-removal.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Guard`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Template Thumbnail Spec`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (6 nodes): `LayerPanelComponent`, `.onDrop()`, `.setLayerOpacity()`, `.toggleLock()`, `.toggleVisibility()`, `layer-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (5 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `btn()`, `mkAuthResponse()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `BackgroundPanelComponent`, `.onCustomColor()`, `.onModeChange()`, `background-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `flushDebounce()`, `setup()`, `templateFactory()`, `gallery.component.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `seed_templates()` connect `Seed & Migrations` to `Database + FastAPI Bootstrap`, `Project Models & Routes`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `FabricObject` connect `Editor Spec Fabric Mocks` to `Animation Service`, `Project Models & Routes`, `Accessibility Service`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Seed & Migrations` to `Animation Service`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `Brand kit API: per-user saved colors, fonts, and logos.`, `Comments API: per-project annotation threads with replies.`, `ng serve (dev server)` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Animation Service` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Canvas Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Project Models & Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._