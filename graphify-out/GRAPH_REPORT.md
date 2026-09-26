# Graph Report - vedic-puja-sanskar  (2026-09-26)

## Corpus Check
- Corpus is ~30,154 words - fits in a single context window. You may not need a graph.

## Summary
- 526 nodes · 1293 edges · 41 communities (22 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Storefront Pages
- API DTOs and Handlers
- Frontend Tooling
- Handler Validation
- Shopping Cart Domain
- Backend Startup
- Order Processing
- Authentication UI
- TypeScript Configuration
- Admin Application Shell
- Home Page Components
- Authentication Services
- User Management
- System Architecture
- Product Management
- Category Management
- Application Styling
- Frontend Auth State
- Database Repositories
- Frontend Auth API
- HTTP Middleware and Routes
- HTTP Server Lifecycle
- Next.js Generated Types
- Database Setup
- Backend Architecture
- Backend Documentation
- PostCSS Configuration
- Next.js Agent Rules
- Frontend Project Guidance
- File Icon Asset
- Globe Icon Asset
- Next.js Logo Asset
- Vercel Logo Asset
- Window Icon Asset
- Next.js Application
- Backend Repository

## God Nodes (most connected - your core abstractions)
1. `WriteError()` - 18 edges
2. `WriteJSON()` - 17 edges
3. `react` - 17 edges
4. `New()` - 16 edges
5. `react-redux` - 16 edges
6. `compilerOptions` - 16 edges
7. `UserRepository` - 15 edges
8. `getErrorMessage()` - 15 edges
9. `RootState` - 15 edges
10. `Server` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Frontend Backend API` --conceptually_related_to--> `Go Authentication API`  [INFERRED]
  frontend/ARCHITECTURE.md → backend/README.md
- `Redux State Management` --semantically_similar_to--> `Redux Authentication`  [INFERRED] [semantically similar]
  frontend/ARCHITECTURE.md → frontend/REDUX_SETUP.md
- `Frontend Backend API` --semantically_similar_to--> `Frontend Backend Integration`  [INFERRED] [semantically similar]
  frontend/ARCHITECTURE.md → frontend/INTEGRATION_GUIDE.md
- `JWT Axios Interceptors` --semantically_similar_to--> `Auth Service`  [INFERRED] [semantically similar]
  frontend/AXIOS_INSTANCE.md → frontend/REDUX_SETUP.md
- `main()` --calls--> `New()`  [EXTRACTED]
  backend/cmd/server/main.go → backend/internal/server/server.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Authentication User Experience** — frontend_architecture_authentication_flow, frontend_redux_setup_redux_authentication, frontend_redux_setup_auth_service, frontend_toast_implementation_authentication_toasts [EXTRACTED 1.00]
- **Backend Authentication Delivery** — backend_project_files_go_backend_architecture, backend_project_files_authentication_authorization, backend_readme_go_authentication_api, backend_docker_compose_backend_container [INFERRED 0.85]

## Communities (41 total, 19 thin omitted)

### Community 0 - "Storefront Pages"
Cohesion: 0.06
Nodes (58): AdminProducts(), CartPage(), formatPrice(), Home(), ProductForm(), ProductFormData, ProductFormProps, ProductCardUser() (+50 more)

### Community 1 - "API DTOs and Handlers"
Cohesion: 0.16
Nodes (28): ValidateStrongPassword(), AddItemToCartRequest, ProductImageUploadResponse, RemoveItemFromCartRequest, go_pkg_context, go_pkg_database_sql, go_pkg_encoding_json, go_pkg_errors (+20 more)

### Community 2 - "Frontend Tooling"
Cohesion: 0.05
Nodes (38): eslintConfig, dependencies, axios, lucide-react, next, react, react-dom, react-hot-toast (+30 more)

### Community 3 - "Handler Validation"
Cohesion: 0.17
Nodes (18): validator.Validate, NewAuthHandler(), form.Decoder, validator.Validate, NewCartHandler(), form.Decoder, validator.Validate, NewProductHandler() (+10 more)

### Community 4 - "Shopping Cart Domain"
Cohesion: 0.11
Nodes (10): CartItem, CartResponse, Product, ProductWithCategory, CartRepository, ProductRepository, CartService, NewCartService() (+2 more)

### Community 5 - "Backend Startup"
Cohesion: 0.14
Nodes (18): main(), getEnv(), Config, Load(), AuthConfig, DatabaseConfig, JWTConfig, ServerConfig (+10 more)

### Community 6 - "Order Processing"
Cohesion: 0.14
Nodes (13): OrderRequest, form.Decoder, validator.Validate, NewOrderHandler(), Order, OrderStatus, ReturnStatus, OrderRepository (+5 more)

### Community 7 - "Authentication UI"
Cohesion: 0.16
Nodes (13): AuthModal(), AuthModalProps, HeaderProps, Login(), LoginProps, Signup(), SignupProps, frontend_src_store_slices_authslice_clearerror (+5 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "Admin Application Shell"
Cohesion: 0.14
Nodes (12): nextConfig, AdminSideBar(), adminNavItems, headerNavItems, initialState, frontend_src_store_slices_sidebarslice_setismobile, frontend_src_store_slices_sidebarslice_setsidebaropen, sidebarSlice (+4 more)

### Community 10 - "Home Page Components"
Cohesion: 0.16
Nodes (12): Footer(), Header(), FeaturesSection(), Hero(), HomeMain(), initialProducts, Newsletter(), Product (+4 more)

### Community 11 - "Authentication Services"
Cohesion: 0.18
Nodes (10): AuthResponse, LoginRequest, SignupRequest, AuthService, NewAuthService(), Claims, TokenManager, NewTokenManager() (+2 more)

### Community 12 - "User Management"
Cohesion: 0.15
Nodes (8): User, UserRole, UserRepository, createDefaultAccount(), HashPassword(), time.Time, CartItem, OrderItem

### Community 13 - "System Architecture"
Cohesion: 0.13
Nodes (15): Backend Docker Container, Go Authentication API, Local File Storage, Authentication Flow, Frontend Backend API, LocalStorage Authentication Persistence, Redux State Management, JWT Axios Interceptors (+7 more)

### Community 14 - "Product Management"
Cohesion: 0.21
Nodes (9): DeleteProductReponse, ProductListResponse, ProductRequest, ProductResponse, UpdateProductRequest, ProductService, Category, ProductImageUploadRequest (+1 more)

### Community 15 - "Category Management"
Cohesion: 0.21
Nodes (10): CategoryListResponse, validator.Validate, NewCategoryHandler(), Category, CategoryRepository, CategoryService, NewCategoryService(), NewProductService() (+2 more)

### Community 16 - "Application Styling"
Cohesion: 0.18
Nodes (8): frontend_src_app_globals, geistMono, geistSans, metadata, ReduxProvider(), ToastProvider(), store, frontend_src_store_slices_authslice_hydrateauth

### Community 17 - "Frontend Auth State"
Cohesion: 0.35
Nodes (8): AuthInitializer(), authSlice, AuthState, initialState, User, getStoredItem(), removeStoredItem(), setStoredItem()

### Community 18 - "Database Repositories"
Cohesion: 0.33
Nodes (8): Connection, NewConnection(), NewCartRepository(), NewCategoryRepository(), NewProductRepository(), NewUserRepository(), New(), database/sql.DB

### Community 19 - "Frontend Auth API"
Cohesion: 0.43
Nodes (3): authService, getApiErrorMessage(), AuthResponse

### Community 20 - "HTTP Middleware and Routes"
Cohesion: 0.47
Nodes (5): AuthMiddleware(), CORSMiddleware(), ServeImage(), net/http.Handler, net/http.HandlerFunc

### Community 21 - "HTTP Server Lifecycle"
Cohesion: 0.40
Nodes (3): validator.Validate, net/http.Server, Server

## Knowledge Gaps
- **102 isolated node(s):** `github.com/Himanshu0208/vedic-puja-sanskar/backend`, `AddItemToCartRequest`, `RemoveItemFromCartRequest`, `ProductImageUploadResponse`, `CreateProductRequest` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 169 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Authentication UI` to `Storefront Pages`, `Frontend Tooling`, `Admin Application Shell`, `Home Page Components`, `Application Styling`, `Frontend Auth State`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Server` connect `HTTP Server Lifecycle` to `API DTOs and Handlers`, `Shopping Cart Domain`, `Backend Startup`, `Authentication Services`, `Product Management`, `Category Management`, `Database Repositories`, `HTTP Middleware and Routes`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `@reduxjs/toolkit` connect `Storefront Pages` to `Frontend Auth State`, `Frontend Tooling`, `Admin Application Shell`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `github.com/Himanshu0208/vedic-puja-sanskar/backend`, `AddItemToCartRequest`, `RemoveItemFromCartRequest` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Storefront Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.060917343526039176 - nodes in this community are weakly interconnected._
- **Should `Frontend Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Shopping Cart Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._