# MCP Servers Configuration

This document describes the Model Context Protocol (MCP) servers configured for the OliveLog project.

## Configured Servers

### 1. Neon MCP Server

**Purpose**: Database management and operations for PostgreSQL databases hosted on Neon

**Configuration**:

```json
"Neon": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "https://mcp.neon.tech/sse"]
}
```

**Capabilities**:

- Create and manage Neon projects
- Execute SQL queries and transactions
- Database schema management
- User management and authentication setup
- Performance monitoring and query optimization

### 2. Git MCP Server

**Purpose**: Git repository management and version control operations

**Configuration**:

```json
"git": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-git"]
}
```

**Capabilities**:

- Repository status and information
- Branch management (create, switch, delete)
- Commit operations and history
- File staging and unstaging
- Remote repository operations (push, pull, fetch)
- Diff viewing and conflict resolution
- Tag management

## Usage Examples

### Git Operations

With the git MCP server, you can now ask the assistant to:

- **Check repository status**: "What's the current git status?"
- **Create and switch branches**: "Create a new feature branch for authentication"
- **Commit changes**: "Commit all staged files with message 'Add farm creation feature'"
- **View git history**: "Show me the last 10 commits"
- **Manage remotes**: "Push changes to origin main"
- **View differences**: "Show me what changed in the last commit"

### Database Operations (Neon)

- **Schema management**: "Add a new table for olive tree records"
- **Query execution**: "Show me all farms created in the last week"
- **Performance analysis**: "Analyze the performance of my user queries"
- **Authentication setup**: "Set up authentication for my project"

## Benefits

### Git MCP Server Benefits:

1. **Integrated Workflow**: Perform git operations without leaving the conversation
2. **Context Awareness**: The assistant understands your project structure and can make intelligent git decisions
3. **Error Prevention**: Built-in validation and safety checks for git operations
4. **Automation**: Automate complex git workflows and repository management tasks

### Combined Benefits:

- Seamless coordination between database changes and version control
- Automated deployment workflows
- Database migration tracking with git commits
- Comprehensive project management from a single interface

## Security Considerations

- MCP servers run locally and have access to your repository
- Always review suggested operations before approval
- The git server respects your existing git configuration and credentials
- Database operations through Neon MCP are secured by your Neon authentication

## Troubleshooting

If you encounter issues with the MCP servers:

1. **Restart Cursor** to reload the MCP configuration
2. **Check npm connectivity** if servers fail to load
3. **Verify git installation** for git MCP server functionality
4. **Confirm Neon authentication** for database operations

## Next Steps

With both MCP servers configured, you can now:

1. Use integrated git workflows for feature development
2. Automate database schema changes with version control
3. Implement CI/CD processes with database migrations
4. Monitor and optimize both code and database performance

For more information about MCP, visit: https://modelcontextprotocol.io/
