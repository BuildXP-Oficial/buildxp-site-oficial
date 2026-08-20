using System.Collections.Concurrent;
using BuildXP.API.Models;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Repositories;

namespace BuildXP.API.Services;

public class TerminalQuestaoService
{
    private const int TamanhoHistoricoRecente = 6;

    private static readonly ConcurrentDictionary<string, Queue<int>> RecentesPorChave = new(StringComparer.OrdinalIgnoreCase);
    private static readonly object HistoricoLock = new();
    private static readonly TerminalQuestao DesafioPadrao = new()
    {
        Id = 0,
        Tema = "git",
        Nivel = "iniciante",
        Titulo = "Repositório local",
        Enunciado = "Inicialize um repositório Git na pasta atual.",
        ComandoEsperado = "git init",
        XpRecompensa = 10,
    };

    private static readonly HashSet<string> NiveisValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "iniciante",
        "avancado",
        "arena",
    };

    private readonly ITerminalQuestaoRepository _repositorio;
    private readonly ILogger<TerminalQuestaoService> _logger;
    private readonly Random _random = new();

    public TerminalQuestaoService(
        ITerminalQuestaoRepository repositorio,
        ILogger<TerminalQuestaoService> logger)
    {
        _repositorio = repositorio;
        _logger = logger;
    }

    public async Task<TerminalQuestaoDto> ObterDesafioAleatorio(string tema, string nivel)
    {
        var temaNorm = NormalizarTema(tema);
        var nivelNorm = NormalizarNivel(nivel);
        var todas = (await _repositorio.ObterTodas()).ToList();

        var pool = MontarPool(todas, temaNorm, nivelNorm);
        if (pool.Count == 0)
        {
            _logger.LogWarning(
                "Tema ou nível sem questões. Fallback ativado. Tema={Tema} Nivel={Nivel}",
                temaNorm,
                nivelNorm);
            return TerminalQuestaoDto.FromEntity(DesafioPadrao);
        }

        var chave = $"{temaNorm}|{nivelNorm}";
        var escolhido = SortearForaDoHistoricoRecente(pool, chave);
        return TerminalQuestaoDto.FromEntity(escolhido);
    }

    private List<TerminalQuestao> MontarPool(
        IReadOnlyList<TerminalQuestao> catalogo,
        string tema,
        string nivel)
    {
        if (string.IsNullOrWhiteSpace(tema) || string.IsNullOrWhiteSpace(nivel))
            return [];

        if (!NiveisValidos.Contains(nivel))
            return [];

        var temas = catalogo
            .Select(d => d.Tema)
            .Distinct(StringComparer.OrdinalIgnoreCase);
        if (!temas.Contains(tema, StringComparer.OrdinalIgnoreCase))
            return [];

        IEnumerable<TerminalQuestao> doTema = catalogo
            .Where(d => string.Equals(d.Tema, tema, StringComparison.OrdinalIgnoreCase));

        if (nivel == "arena")
        {
            return doTema
                .Where(d =>
                    string.Equals(d.Nivel, "iniciante", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(d.Nivel, "avancado", StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return doTema
            .Where(d => string.Equals(d.Nivel, nivel, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private TerminalQuestao SortearForaDoHistoricoRecente(
        IReadOnlyList<TerminalQuestao> pool,
        string chave)
    {
        lock (HistoricoLock)
        {
            var recentes = RecentesPorChave.GetOrAdd(chave, _ => new Queue<int>());
            var recentesSet = recentes.ToHashSet();
            var limiteSorteios = Math.Max(24, pool.Count * 3);

            var escolhido = pool[_random.Next(pool.Count)];
            var tentativas = 1;

            while (recentesSet.Contains(escolhido.Id) && tentativas < limiteSorteios)
            {
                var livres = pool.Where(d => !recentesSet.Contains(d.Id)).ToList();
                if (livres.Count == 0)
                    break;

                escolhido = livres[_random.Next(livres.Count)];
                tentativas++;
            }

            recentes.Enqueue(escolhido.Id);
            while (recentes.Count > TamanhoHistoricoRecente)
                recentes.Dequeue();

            return escolhido;
        }
    }

    private static string NormalizarTema(string? tema)
    {
        var t = (tema ?? string.Empty).Trim().ToLowerInvariant();
        return t switch
        {
            "git" => "git",
            "docker" => "docker",
            "npm" => "npm",
            "python" => "python",
            "java" => "java",
            "dotnet" or ".net" or "net" or "c#" or "csharp" => "dotnet",
            _ => t,
        };
    }

    private static string NormalizarNivel(string? nivel)
    {
        var n = (nivel ?? string.Empty).Trim().ToLowerInvariant();
        n = n.Replace("ç", "c").Replace("á", "a").Replace("ã", "a");
        return n switch
        {
            "iniciante" or "beginner" => "iniciante",
            "avancado" or "advanced" => "avancado",
            "arena" or "mixed" => "arena",
            _ => n,
        };
    }
}
