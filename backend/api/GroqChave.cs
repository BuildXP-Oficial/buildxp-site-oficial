namespace BuildXP.API;

internal static class GroqChave
{
    internal static string? Obter(IConfiguration config)
    {
        var env = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        if (!string.IsNullOrWhiteSpace(env))
            return env.Trim();

        var configurada = config["GroqApiKey"];
        if (!string.IsNullOrWhiteSpace(configurada))
            return configurada.Trim();

        return null;
    }

    internal static bool EstaConfigurada(IConfiguration config) =>
        !string.IsNullOrWhiteSpace(Obter(config));
}
