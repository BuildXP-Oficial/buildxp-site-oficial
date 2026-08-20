using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class TerminalMentorService
{
    private readonly ILogger<TerminalMentorService> _logger;

    public TerminalMentorService(ILogger<TerminalMentorService> logger)
    {
        _logger = logger;
    }

    public Task<MentorRespostaDto> GerarExplicacaoAsync(MentorRequisicaoDto requisicao)
    {
        var resposta = new MentorRespostaDto
        {
            Explicacao = MontarExplicacao(requisicao),
        };
        return Task.FromResult(resposta);
    }

    private string MontarExplicacao(MentorRequisicaoDto? requisicao)
    {
        var usuario = Normalizar(requisicao?.ComandoUsuario);
        var esperado = Normalizar(requisicao?.ComandoEsperado);

        if (string.IsNullOrWhiteSpace(esperado))
        {
            _logger.LogWarning("Mentor recebeu comando esperado vazio.");
            return "Ainda não tenho o comando certo deste desafio para te orientar. Tente de novo em instantes.";
        }

        if (string.IsNullOrWhiteSpace(usuario))
            return $"Você ainda não digitou nada. O comando esperado começa com `{PrimeiroToken(esperado)}`. Escreva o comando completo e envie.";

        if (Iguais(usuario, esperado))
            return "Mandou bem — o comando está alinhado com o esperado. Se quiser ir além, releia o enunciado e pense no porquê de cada flag.";

        var tokensUsuario = Tokenizar(usuario);
        var tokensEsperado = Tokenizar(esperado);

        if (tokensUsuario.Count == 0 || tokensEsperado.Count == 0)
            return $"Quase. O formato esperado é `{esperado}`.";

        var ferramentaUsuario = tokensUsuario[0];
        var ferramentaEsperada = tokensEsperado[0];
        if (!Iguais(ferramentaUsuario, ferramentaEsperada)
            && Distancia(ferramentaUsuario, ferramentaEsperada) > 2)
        {
            return $"Este desafio pede `{ferramentaEsperada}`, mas você usou `{ferramentaUsuario}`. Troque a ferramenta e tente de novo: `{esperado}`.";
        }

        if (!Iguais(ferramentaUsuario, ferramentaEsperada))
            return $"Quase na ferramenta: você escreveu `{ferramentaUsuario}`, mas o comando começa com `{ferramentaEsperada}`. Fica assim: `{esperado}`.";

        var flagsUsuario = tokensUsuario.Skip(1).Where(EhFlag).ToList();
        var flagsEsperadas = tokensEsperado.Skip(1).Where(EhFlag).ToList();
        var argsUsuario = tokensUsuario.Skip(1).Where(t => !EhFlag(t)).ToList();
        var argsEsperados = tokensEsperado.Skip(1).Where(t => !EhFlag(t) && !EhPlaceholder(t)).ToList();

        var flagFaltando = flagsEsperadas.FirstOrDefault(f => !flagsUsuario.Any(u => Iguais(u, f)));
        if (flagFaltando is not null)
        {
            var parecida = flagsUsuario.FirstOrDefault(u => Distancia(u, flagFaltando) <= 2);
            if (parecida is not null)
                return $"A flag `{parecida}` está perto, mas o esperado é `{flagFaltando}`. Ajuste e o comando fica `{esperado}`.";
            return $"Faltou a flag `{flagFaltando}`. Sem ela o comando muda de comportamento. Tente: `{esperado}`.";
        }

        var flagSobra = flagsUsuario.FirstOrDefault(u => !flagsEsperadas.Any(e => Iguais(e, u)));
        if (flagSobra is not null)
            return $"A flag `{flagSobra}` não entra neste desafio. Remova e use só o necessário: `{esperado}`.";

        if (argsEsperados.Count > argsUsuario.Count)
        {
            var faltou = argsEsperados.Skip(argsUsuario.Count).FirstOrDefault();
            if (faltou is not null)
                return $"Faltou o argumento `{faltou}` depois de `{ferramentaEsperada}`. Complete o comando: `{esperado}`.";
        }

        if (argsUsuario.Count > argsEsperados.Count && argsEsperados.Count > 0)
            return $"Tem argumento a mais. Este desafio espera `{esperado}` — tire o extra e envie de novo.";

        for (var i = 0; i < Math.Min(argsUsuario.Count, argsEsperados.Count); i++)
        {
            if (Iguais(argsUsuario[i], argsEsperados[i]))
                continue;
            if (Distancia(argsUsuario[i], argsEsperados[i]) <= 2)
                return $"`{argsUsuario[i]}` parece um erro de digitação. O argumento esperado é `{argsEsperados[i]}`. Comando certo: `{esperado}`.";
            return $"O argumento `{argsUsuario[i]}` não bate. Aqui o valor esperado é `{argsEsperados[i]}`. Tente: `{esperado}`.";
        }

        if (tokensUsuario.Count != tokensEsperado.Count)
            return $"A estrutura está quase lá, mas a ordem ou a quantidade de partes difere. O modelo é `{esperado}`.";

        return $"Ainda não fechou. Compare o que você digitou com `{esperado}`: veja a ferramenta, as flags (`-`/`--`) e os argumentos na ordem.";
    }

    private static string Normalizar(string? comando)
    {
        if (string.IsNullOrWhiteSpace(comando))
            return string.Empty;
        return string.Join(' ', comando.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static List<string> Tokenizar(string comando) =>
        comando.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();

    private static string PrimeiroToken(string comando) =>
        Tokenizar(comando).FirstOrDefault() ?? comando;

    private static bool EhFlag(string token) =>
        token.StartsWith('-');

    private static bool EhPlaceholder(string token) =>
        (token.StartsWith('<') && token.EndsWith('>'))
        || (token.StartsWith('{') && token.EndsWith('}'));

    private static bool Iguais(string a, string b) =>
        string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static int Distancia(string a, string b)
    {
        a = a.ToLowerInvariant();
        b = b.ToLowerInvariant();
        if (a == b) return 0;
        if (a.Length == 0) return b.Length;
        if (b.Length == 0) return a.Length;

        var prev = Enumerable.Range(0, b.Length + 1).ToArray();
        var curr = new int[b.Length + 1];
        for (var i = 1; i <= a.Length; i++)
        {
            curr[0] = i;
            for (var j = 1; j <= b.Length; j++)
            {
                var custo = a[i - 1] == b[j - 1] ? 0 : 1;
                curr[j] = Math.Min(Math.Min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + custo);
            }
            (prev, curr) = (curr, prev);
        }
        return prev[b.Length];
    }
}
