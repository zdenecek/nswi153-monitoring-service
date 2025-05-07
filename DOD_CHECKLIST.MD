# Monitoring Service Delivery Checklist

## Core Functionality
- [x] Project entity with label, description, and tags
- [x] Project creation and editing 
- [x] Project listing with pagination, filtering, and sorting
- [ ] Monitor entity with label, periodicity, type, badge label
- [ ] Ping monitor (TCP/IP connection) implementation
  - [ ] Port setting
  - [ ] Host/IP setting
- [ ] Website monitor implementation
  - [ ] URL setting
  - [ ] Status check option
  - [ ] Keywords check option
- [ ] Monitoring check execution system (separate from HTTP backend)
- [ ] Monitor check record storage (time, status, response time)

## Views/Pages
- [ ] Landing page with project info and repo link
- [x] Project list with filtering, pagination, and sorting
- [x] Project detail with properties editing
- [ ] Monitor list on project page with filtering
- [ ] Monitor creation and deletion from project page
- [ ] Monitor detail page with property editing
- [ ] Monitor history list mode (paginated, filterable)
- [ ] Calendar mode (3+ month view with color-coded days)
- [ ] Graph mode (response time vs. time)
- [ ] Live updates (non-reloading) for all monitor views

## API Implementation
- [ ] RESTful API
  - [ ] Project resources (CRUD)
  - [ ] Monitor resources (CRUD)
  - [ ] Monitor status resources (read-only)
  - [ ] OpenAPI/Swagger documentation
- [ ] GraphQL API
  - [ ] Projects query
  - [ ] Status query with filters
  - [ ] Required schema implementation
- [ ] HTTP Badge API
  - [ ] SVG badge generation based on monitor status
  - [ ] Configurable label from monitor badge label
  - [ ] Status display ("up"/"down")
  - [ ] Color coding (green/red)

## Deployment
- [ ] Environment configuration via .env file
- [ ] Docker Compose setup
- [ ] Database persistence
- [ ] Named volume for data persistence across restarts

## Documentation
- [ ] README.md with:
  - [ ] Project name
  - [ ] Brief description
  - [ ] Installation instructions

## Code Quality
- [ ] Linter configuration for all code
- [ ] Prettier formatting when possible
- [ ] Regular commits to Git repository

## Technical Implementation
- [ ] Frontend with required views
- [ ] Backend with API endpoints
- [ ] Database setup and migrations
- [ ] Monitor checking service
- [ ] Real-time updates implementation

## Testing & Performance
- [ ] Pagination implementation for all lists
- [ ] Filter implementation for all lists
- [ ] Live updates working within 5-second interval
- [ ] Correct status calculation for calendar view
- [ ] Response time tracking and graphing

## Completion
- [ ] All features implemented
- [ ] Docker Compose deployment working
- [ ] Database persistence verified
- [ ] Documentation completed
- [ ] Project ready for presentation
