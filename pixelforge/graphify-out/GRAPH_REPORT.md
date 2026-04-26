# Graph Report - /home/ashulabs/workspace/pixels/pixelforge  (2026-04-26)

## Corpus Check
- 209 files · ~50,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1693 nodes · 3656 edges · 57 communities detected
- Extraction: 53% EXTRACTED · 47% INFERRED · 0% AMBIGUOUS · INFERRED: 1708 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 95 edges
2. `Editor` - 60 edges
3. `PropertyPanelComponent` - 55 edges
4. `SidebarDrawerComponent` - 52 edges
5. `TextToolbarComponent` - 50 edges
6. `Dashboard` - 33 edges
7. `AuthResponse` - 31 edges
8. `ApiService` - 31 edges
9. `UserPublic` - 30 edges
10. `UserUpdate` - 30 edges

## Surprising Connections (you probably didn't know these)
- `is_connected()` --calls--> `list_comments()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py → backend/app/comments_routes.py
- `AssetResponse` --uses--> `Delete an asset record and its on-disk file.      Args:         asset_id: MongoD`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/models.py → backend/app/asset_routes.py
- `AssetResponse` --uses--> `List assets, optionally scoped to a project.      Args:         db: Async Mongo`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/models.py → backend/app/asset_routes.py
- `is_connected()` --calls--> `get_brand_kit()`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/database.py → backend/app/brand_routes.py
- `AssetResponse` --uses--> `Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId`  [INFERRED]
  /home/ashulabs/workspace/pixels/pixelforge/backend/app/models.py → /home/ashulabs/workspace/pixels/pixelforge/backend/app/asset_routes.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (10): CanvasService, ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, ImageFiltersPanelComponent, ProfileComponent, PropertyPanelComponent, AC-1 guardrail: the in-module SPECS list is the source of truth.      Prevents a (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.01
Nodes (216): ApiService, get_asset(), Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId, decode_email_change_token(), Decode + validate an email-change token (PX-074).      Returns the payload on su, get_brand_kit(), Return the authenticated user's brand kit.      Args:         db: Async Mongo da, ConnectionManager (+208 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (111): AuthResponse, create_email_change_token(), create_token(), decode_token(), EmailChangeConfirm, EmailChangeRequest, get_current_user(), hash_password() (+103 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (8): BackgroundPanelComponent, isLightColor(), Editor, HistoryService, KeyboardService, _clear_outbox(), Each test starts with an empty mailer OUTBOX., ToolbarPanelComponent

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (8): AiBackgroundService, BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg(), DesignHelperService, SidebarDrawerComponent

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (13): AlignmentPanelComponent, AnimationService, AnimationTimeline, makeService(), CollaborationService, GradientPanelComponent, Circle, FabricImage (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (8): Canvas, ExportDialog, ExportService, setup(), StaticCanvas, templateFactory(), getPlatformPreset(), ResizeDialog

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (3): Dashboard, ProjectService, UserMenuComponent

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (32): ActiveSelection, bootstrap(), Circle, FabricImage, FabricObject, FabricText, Group, IText (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (3): CommentsOverlay, CommentsService, FontService

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (38): delete_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively., Delete an asset record and its on-disk file.      Args:         asset_id: MongoD, Delete an asset record and its on-disk file.      Args:         asset_id: MongoD, List assets, optionally scoped to a project.      Args:         db: Async Mongo (+30 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (4): AiDesignService, QualityScoreService, TemplateService, ThemeService

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (11): AccessibilityService, AuditDialog, CommandPalette, close_db(), connect_db(), get_db(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, Return the MongoDB database handle.      Raises a clear error if the DB is not c (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (23): authInterceptor(), emptyCanvasFor(), GalleryComponent, PresentationMode, Email-change flow tests (PX-074).  Covers /api/auth/me/email (request) and /api/, POST /me/email/confirm with a valid token swaps the email., Garbage token returns 400., Expired token returns 400 with "expired" message. (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (2): CanvasRulersComponent, VersionsDialog

### Community 17 - "Community 17"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (2): AuthComponent, AuthService

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): Happy-path coverage for comments_routes endpoints after the Depends refactor., POST a comment then GET surfaces it by projectId + text., # NOTE: list_comments re-derives ``id`` from ``_id`` when Mongo auto-assigns, PATCH toggles resolved flag., DELETE removes the comment., POST /{id}/replies appends a reply., GET /api/projects/{pid}/comments returns [] when none exist., test_add_reply() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.42
Nodes (1): MagicWriteService

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (1): BrandKitApplyService

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (1): ColorPickerComponent

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (5): PaletteSlot, Pydantic v2 schema for the ``templates`` collection (ARD §8.1).  These models de, Return the current UTC time as a timezone-aware :class:`datetime`.      Returns:, One palette slot declared by a seed template.      A palette slot pairs a *role*, _utc_now()

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): Tests for migration 0001 — projects.platform backfill (PX-060 T-0).  Exercises:, Docs without ``platform`` get a preset id inferred from width × height., Re-running the migration is a no-op for rows that already have ``platform``., Empty collection yields a {0, 0, 0} summary without error., test_backfills_missing_platform_from_dims(), test_empty_collection_returns_zero_summary(), test_skips_already_migrated_rows()

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (1): ShareDialog

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (1): HubComponent

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (8): Angular CLI, ng build, ng e2e (end-to-end tests), ng generate (scaffolding), ng serve (dev server), ng test (Vitest runner), Pixelforge Project, Vitest

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (2): authGuard(), FakeAuthService

### Community 30 - "Community 30"
Cohesion: 0.52
Nodes (1): BackgroundRemovalService

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 32 - "Community 32"
Cohesion: 0.43
Nodes (1): OnboardingTour

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (2): mkAuthResponse(), setup()

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (1): LayerPanelComponent

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 38 - "Community 38"
Cohesion: 0.4
Nodes (1): PluginRegistry

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 41 - "Community 41"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (1): PwaInstallPrompt

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (1): StyleVariationsService

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): GIF

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): App

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): ContextToolbarComponent

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): Partial-update payload for the authenticated user's own profile.      Fields def

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): Authenticated password-rotation payload (PX-075).      Both fields are required.

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Returns user dict if authenticated, None otherwise (optional auth).

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): Requires authenticated user or raises 401.

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (1): One platform-size preset record.      Attributes:         id: Stable identifier

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (1): Look up a platform preset by id.      Args:         preset_id: The preset id to

## Knowledge Gaps
- **236 isolated node(s):** `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Transactional email helper (PX-074).  Wraps Resend's REST API for the single use`, `Send a single transactional email.      Args:         to: Recipient's email addr`, `Plain HTML body for the new-address confirmation message (PX-074).`, `Notification sent to the OLD email when a change is requested (PX-074).` (+231 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (22 nodes): `.createVersion()`, `.restoreVersion()`, `CanvasRulersComponent`, `.drawHorizontalRuler()`, `.drawRulers()`, `.drawVerticalRuler()`, `.getGuideScreenPos()`, `.getStep()`, `.ngAfterViewInit()`, `.onMouseMove()`, `.onMouseUp()`, `.removeGuide()`, `.startDragGuide()`, `.startMoveGuide()`, `.toggleRulers()`, `canvas-rulers.ts`, `versions-dialog.ts`, `VersionsDialog`, `.createSnapshot()`, `.loadVersions()`, `.ngOnInit()`, `.restore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (19 nodes): `AuthComponent`, `.continueAsGuest()`, `.formatErrorDetail()`, `.submit()`, `.togglePasswordVisibility()`, `AuthService`, `.avatarSrc()`, `.changePassword()`, `.confirmEmailChange()`, `.constructor()`, `.deleteAvatar()`, `.loadFromStorage()`, `.login()`, `.requestEmailChange()`, `.signup()`, `.updateMe()`, `.uploadAvatar()`, `auth.service.ts`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (11 nodes): `MagicWriteService`, `.applySwaps()`, `.generateVariants()`, `.makeLonger()`, `.makeShorter()`, `.removeFillers()`, `.sentenceCase()`, `.titleCase()`, `.toHeadline()`, `.transform()`, `magic-write.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (11 nodes): `.updateProject()`, `BrandKitApplyService`, `._buildSubstitutionMap()`, `.clearMarker()`, `._clearMarkerServerSide()`, `._revertObjectColors()`, `.revertToTemplateDefaults()`, `.finishNameEdit()`, `.addWidget()`, `brand-kit-apply.service.ts`, `.getById()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (9 nodes): `ColorPickerComponent`, `.commitHexInput()`, `.composeHex()`, `.emitChange()`, `.onAlphaChange()`, `.onHexChange()`, `.parseColor()`, `.value()`, `color-picker.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (8 nodes): `.createShareLink()`, `.revokeShareLink()`, `ShareDialog`, `.copyEmbed()`, `.copyLink()`, `.generate()`, `.revoke()`, `share-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (8 nodes): `HubComponent`, `.buildTiles()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (7 nodes): `BackgroundRemovalService`, `.dataURLToBlob()`, `.removeBackground()`, `.removeClientSide()`, `.removeFromDataURL()`, `.removeServerSide()`, `background-removal.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (7 nodes): `OnboardingTour`, `.next()`, `.ngOnInit()`, `.prev()`, `.start()`, `.updateHighlight()`, `onboarding-tour.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (6 nodes): `btn()`, `heading()`, `mkAuthResponse()`, `pills()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (6 nodes): `LayerPanelComponent`, `.onDrop()`, `.setLayerOpacity()`, `.toggleLock()`, `.toggleVisibility()`, `layer-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (5 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (5 nodes): `PluginRegistry`, `.getAll()`, `.getById()`, `.register()`, `plugin-api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `PwaInstallPrompt`, `.ngOnDestroy()`, `.ngOnInit()`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `style-variations.service.ts`, `StyleVariationsService`, `.getAllStyles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `ContextToolbarComponent`, `context-toolbar.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `Partial-update payload for the authenticated user's own profile.      Fields def`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `Authenticated password-rotation payload (PX-075).      Both fields are required.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Returns user dict if authenticated, None otherwise (optional auth).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `Requires authenticated user or raises 401.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `One platform-size preset record.      Attributes:         id: Stable identifier`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `Look up a platform preset by id.      Args:         preset_id: The preset id to`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `makeService()` connect `Community 5` to `Community 6`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `seed_templates()` connect `Community 1` to `Community 13`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Transactional email helper (PX-074).  Wraps Resend's REST API for the single use`, `Send a single transactional email.      Args:         to: Recipient's email addr` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._