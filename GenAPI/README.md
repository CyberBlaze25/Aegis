# GenAPI

GenAPI is a Go-based API boilerplate designed for scalability and modularity.

> **Note:** This project is currently in the early stages of development. Much of the codebase consists of placeholders, with core infrastructure like the logger and basic routing already implemented.

## Getting Started

### Prerequisites

- [Go](https://go.dev/doc/install) 1.25.0 or higher.
- [Docker](https://docs.docker.com/get-docker/) (optional, for containerized deployment).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Pegasis1002/GenAPI.git
   cd genapi
   ```

2. Download dependencies:
   ```bash
   go mod download
   ```

### Running the API

#### Locally

To run the API locally, use the following command:

```bash
DB_URL="postgres://user:password@localhost:5432/dbname" go run cmd/api/main.go
```

The server will start on `http://0.0.0.0:8080`.

#### Using Docker

Build and run the application using Docker Compose:

```bash
docker-compose up --build
```

## Documentation

Full documentation is available in the [GitHub Wiki](https://github.com/Pegasis1002/GenAPI/wiki).

## Contributing

We welcome contributions to GenAPI! To ensure a smooth process, please follow these rules:

1. **Fork and Branch**: Always create a new branch for your feature or bug fix.
2. **Code Style**: Adhere to the standard Go coding conventions (`gofmt`, `go vet`).
3. **Commit Messages**: Use clear, descriptive commit messages.
4. **Pull Requests**: Provide a detailed description of your changes when submitting a PR.
5. **Testing**: Ensure your changes are tested and don't break existing functionality.

## License

This project is licensed under the [AGPLv3 License](LICENSE).
