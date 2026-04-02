package config

type Config struct {
	Server struct {
		Host string `yaml:"host"`
		Port string `yaml:"port"`
	} `yaml:"server"`

	Auth struct {
		EnforceIP bool `yaml:"ip_restriction"`
	} `yaml:"auth"`

	Modules struct {
		Authentication struct {
			Enabled bool `yaml:"enabled"`
		} `yaml:"authentication"`
		AgenticAI struct {
			Enabled bool `yaml:"enabled"`
		} `yaml:"agentic_ai"`
	} `yaml:"modules"`
}
