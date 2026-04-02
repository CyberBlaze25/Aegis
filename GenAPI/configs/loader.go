package config

import (
	"os"

	"github.com/goccy/go-yaml"
)

func LoadConfig(path string) (*Config, error) {
	cfg := &Config{}

	file, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	expandedContext := os.ExpandEnv(string(file))

	err = yaml.Unmarshal([]byte(expandedContext), cfg)
	if err != nil {
		return nil, err
	}

	return cfg, nil
}
