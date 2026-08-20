using System.Text.RegularExpressions;
using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class TerminalMentorService
{
    private static readonly RegexOptions Rx =
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant;

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
        if (EhDesafioDeCodigo(requisicao))
            return MontarExplicacaoCodigo(requisicao);

        return MontarExplicacaoComando(requisicao);
    }

    private static bool EhDesafioDeCodigo(MentorRequisicaoDto? requisicao)
    {
        var lang = NormalizarLinguagem(requisicao?.Linguagem);
        if (lang is "csharp" or "python" or "java")
            return true;

        var bloco = ExtrairBlocoCodigo(requisicao?.ComandoUsuario);
        if (bloco.Contains('\n') || (requisicao?.ComandoUsuario ?? string.Empty).Contains("###"))
            return true;

        var compact = CompactarCodigo(bloco);
        if (compact.Contains("console.writeline") || compact.Contains("static void main"))
            return true;
        if (compact.Contains("system.out.println") || compact.Contains("public static void main"))
            return true;
        if (Regex.IsMatch(compact, @"\bdef\s+\w+\s*\(", Rx)
            || (Regex.IsMatch(compact, @"\bprint\s*\(", Rx) && !compact.StartsWith("git ")))
            return true;

        return false;
    }

    private string MontarExplicacaoCodigo(MentorRequisicaoDto? requisicao)
    {
        var lang = InferirLinguagem(requisicao);
        var bloco = ExtrairBlocoCodigo(requisicao?.ComandoUsuario);
        var rotulo = RotuloLinguagem(lang);

        if (string.IsNullOrWhiteSpace(bloco))
        {
            return $"Você ainda não enviou o bloco de {rotulo}. Escreva o código (várias linhas) e termine com uma linha só com `###`.";
        }

        var compact = CompactarCodigo(bloco);
        var sintaxe = ChecarSintaxeBasica(bloco, compact, lang);
        if (sintaxe is not null)
            return sintaxe;

        var faltando = new List<string>();
        foreach (var criterio in ColetarCriterios(requisicao, lang))
        {
            if (CriterioPresente(compact, criterio, lang))
                continue;
            var dica = DicaDoCriterio(criterio, lang);
            if (!string.IsNullOrWhiteSpace(dica) && !faltando.Contains(dica, StringComparer.OrdinalIgnoreCase))
                faltando.Add(dica);
        }

        if (faltando.Count == 0)
        {
            return $"A estrutura em {rotulo} está perto. Revise operadores, parênteses e se cada palavra-chave do enunciado realmente aparece no bloco.";
        }

        if (faltando.Count == 1)
            return $"No seu código em {rotulo}, {faltando[0]}. Ajuste isso e envie o bloco de novo com `###`.";

        return $"No seu código em {rotulo}, {faltando[0]}. Também {Decapitalizar(faltando[1])}. Corrija e envie outra vez com `###`.";
    }

    private string MontarExplicacaoComando(MentorRequisicaoDto? requisicao)
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

    private static string InferirLinguagem(MentorRequisicaoDto? requisicao)
    {
        var lang = NormalizarLinguagem(requisicao?.Linguagem);
        if (lang is "csharp" or "python" or "java")
            return lang;

        var compact = CompactarCodigo(ExtrairBlocoCodigo(requisicao?.ComandoUsuario))
            + " "
            + CompactarCodigo(requisicao?.Enunciado)
            + " "
            + CompactarCodigo(requisicao?.Feedback);

        if (compact.Contains("console.writeline") || compact.Contains("[c#]") || compact.Contains("static void main"))
            return "csharp";
        if (compact.Contains("system.out.println") || compact.Contains("[java]") || compact.Contains("public static void main"))
            return "java";
        if (compact.Contains("[python]") || Regex.IsMatch(compact, @"\bdef\s+\w+", Rx) || compact.Contains("print("))
            return "python";
        return "csharp";
    }

    private static string NormalizarLinguagem(string? valor)
    {
        var v = (valor ?? string.Empty).Trim().ToLowerInvariant();
        if (v is "c#" or "cs" or ".net" or "dotnet" or "net")
            return "csharp";
        if (v is "py")
            return "python";
        return v;
    }

    private static string RotuloLinguagem(string lang) => lang switch
    {
        "python" => "Python",
        "java" => "Java",
        _ => "C#",
    };

    private static string ExtrairBlocoCodigo(string? bruto)
    {
        if (string.IsNullOrWhiteSpace(bruto))
            return string.Empty;

        var linhas = bruto
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split('\n')
            .Where(l => l.Trim() != "###");
        return string.Join('\n', linhas).Trim();
    }

    private static string CompactarCodigo(string? bruto)
    {
        if (string.IsNullOrWhiteSpace(bruto))
            return string.Empty;

        var t = bruto
            .Replace("\r\n", "\n", StringComparison.Ordinal);
        t = Regex.Replace(t, @"""(?:[^""\\]|\\.)*""|'(?:[^'\\]|\\.)*'", "\"\"");
        t = Regex.Replace(t, @"//[^\n]*", " ");
        t = Regex.Replace(t, @"/\*[\s\S]*?\*/", " ");
        t = Regex.Replace(t, @"#[^\n]*", " ", RegexOptions.Multiline);
        t = Regex.Replace(t, @"\s+", " ");
        return t.Trim().ToLowerInvariant();
    }

    private static string? ChecarSintaxeBasica(string bloco, string compact, string lang)
    {
        var abre = compact.Count(c => c == '{');
        var fecha = compact.Count(c => c == '}');
        if (lang is "csharp" or "java" && abre != fecha)
            return $"As chaves `{{` `}}` não estão balanceadas no seu {RotuloLinguagem(lang)}. Feche cada bloco aberto antes de enviar de novo.";

        var abreP = compact.Count(c => c == '(');
        var fechaP = compact.Count(c => c == ')');
        if (abreP != fechaP)
            return "Os parênteses não fecham. Confira cada `(` e `)` — isso costuma quebrar a compilação.";

        if (lang == "python"
            && Regex.IsMatch(bloco, @"(?im)^\s*(if|elif|else|for|while|try|except|def)\b(?![^\n]*:)"))
        {
            return "Em Python, `if`, `for`, `else`, `try` e `def` terminam com dois-pontos `:`. Faltou essa sintaxe em alguma linha.";
        }

        return null;
    }

    private static List<string> ColetarCriterios(MentorRequisicaoDto? requisicao, string lang)
    {
        var lista = new List<string>();
        if (requisicao?.Criterios is { Count: > 0 })
            lista.AddRange(requisicao.Criterios.Where(c => !string.IsNullOrWhiteSpace(c)));

        var feedback = requisicao?.Feedback ?? string.Empty;
        if (feedback.StartsWith("Precisa:", StringComparison.OrdinalIgnoreCase))
            feedback = feedback["Precisa:".Length..];

        foreach (var parte in feedback.Split(new[] { ',', '·', ';' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var item = parte.Trim();
            if (item.Length > 1)
                lista.Add(item);
        }

        if (lista.Count == 0)
            lista.AddRange(CriteriosPadrao(lang, requisicao?.Enunciado));

        return lista
            .Select(c => c.Trim())
            .Where(c => c.Length > 1)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static IEnumerable<string> CriteriosPadrao(string lang, string? enunciado)
    {
        var e = CompactarCodigo(enunciado);
        yield return lang switch
        {
            "python" => "print()",
            "java" => "System.out.println",
            _ => "Console.WriteLine",
        };
        if (lang is "csharp" or "java")
            yield return "Main";
        if (e.Contains("for") || e.Contains("conta"))
            yield return "for";
        if (e.Contains("if"))
            yield return "if";
        if (e.Contains("else"))
            yield return "else";
        if (e.Contains("class"))
            yield return "class";
        if (e.Contains("return"))
            yield return "return";
        if (e.Contains("try"))
            yield return lang == "python" ? "try/except" : "try/catch";
    }

    private static bool CriterioPresente(string compact, string criterio, string lang)
    {
        var c = CompactarCodigo(criterio);
        if (string.IsNullOrWhiteSpace(c))
            return true;

        foreach (var padrao in PadroesDaLinguagem(lang))
        {
            if (!padrao.Bate(c))
                continue;
            return Regex.IsMatch(compact, padrao.Regex, Rx);
        }

        var tokens = Regex.Split(c, @"[^a-z0-9_.*&|<>=+/]+")
            .Where(t => t.Length >= 2 && t is not "com" and not "uma" and not "para" and not "cada" and not "ou")
            .ToList();
        if (tokens.Count == 0)
            return compact.Contains(c);
        return tokens.Any(t => compact.Contains(t));
    }

    private static string DicaDoCriterio(string criterio, string lang)
    {
        var c = CompactarCodigo(criterio);
        foreach (var padrao in PadroesDaLinguagem(lang))
        {
            if (padrao.Bate(c))
                return padrao.Dica;
        }

        var trecho = criterio.Trim().TrimEnd('.');
        if (trecho.Length > 80)
            trecho = trecho[..77] + "…";
        return $"faltou {trecho}";
    }

    private static IEnumerable<(Func<string, bool> Bate, string Regex, string Dica)> PadroesDaLinguagem(string lang)
    {
        if (lang == "python")
        {
            yield return (c => Contem(c, "print"), @"\bprint\s*\(", "faltou `print()` para mostrar o resultado");
            yield return (c => Contem(c, "input"), @"input\s*\(", "faltou `input()` para ler um valor");
            yield return (c => Contem(c, "int(") || Contem(c, "int()") || Contem(c, "float"), @"\b(int|float)\s*\(", "faltou converter com `int()` ou `float()`");
            yield return (c => Contem(c, "for") && Contem(c, "in"), @"\bfor\s+\w+\s+in\b", "faltou o loop `for ... in`");
            yield return (c => Contem(c, "for"), @"\bfor\s+\w+", "faltou um `for` para percorrer os dados");
            yield return (c => Contem(c, "elif"), @"\belif\s+", "faltou o `elif` para o segundo ramo");
            yield return (c => Contem(c, "else"), @"\belse\s*:", "faltou o `else:`");
            yield return (c => Contem(c, "if"), @"\bif\s+", "faltou o `if` com a condição do enunciado");
            yield return (c => Contem(c, "sum"), @"\bsum\s*\(", "faltou `sum()` na média ou soma");
            yield return (c => Contem(c, "len"), @"\blen\s*\(", "faltou `len()` (tamanho da lista)");
            yield return (c => Contem(c, "zip"), @"\bzip\s*\(", "faltou `zip()` para percorrer as duas listas juntas");
            yield return (c => Contem(c, "append") || Contem(c, "comprehension"), @"(\.append\s*\(|\bfor\s+[\w\s,]+\bin\b[\w\s,]*\bif\b)", "faltou `.append()` ou uma list comprehension com `if`");
            yield return (c => Contem(c, "except"), @"\bexcept\b", "faltou o `except` para tratar o erro");
            yield return (c => Contem(c, "try"), @"\btry\s*:", "faltou o `try:`");
            yield return (c => Contem(c, "max"), @"\bmax\s*\(", "faltou achar o maior valor (`max()` ou `for`+`if`)");
            yield return (c => Contem(c, "dict") || (c.Contains('{') && c.Contains('}')), @"\{[^}]+\}", "faltou um dicionário `{ chave: valor }`");
            yield return (c => Contem(c, "lista") || c.Contains('['), @"\[[^\]]*\]|\blist\s*\(", "faltou criar uma lista `[...]`");
            yield return (c => Contem(c, "25"), @"\b25\b", "faltou a condição com `25`");
            yield return (c => Contem(c, ">=") || Contem(c, "meta") || Contem(c, "compar"), @">=|>|<=|<", "faltou o operador de comparação (`>=`, `>` etc.)");
            yield break;
        }

        if (lang == "java")
        {
            yield return (c => Contem(c, "main") || Contem(c, "estático") || Contem(c, "estatico"), @"public\s+static\s+void\s+main\s*\(", "faltou `public static void main(...)`");
            yield return (c => Contem(c, "println") || Contem(c, "system.out"), @"system\.out\.println\s*\(", "faltou `System.out.println` para imprimir");
            yield return (c => c.Contains('*') || Contem(c, "operador") || Contem(c, "4") && Contem(c, "5"), @"\*", "faltou o operador `*` (por exemplo na área 4 * 5)");
            yield return (c => Contem(c, "else if") || Contem(c, "elseif"), @"\belse\s+if\s*\(", "faltou o `else if`");
            yield return (c => Contem(c, "else"), @"\belse\b", "faltou o `else`");
            yield return (c => Contem(c, "if") && (c.Contains("&&") || c.Contains("||")), @"\bif\s*\(.*(&&|\|\|)", "faltou um `if` com `&&` ou `||`");
            yield return (c => Contem(c, "if"), @"\bif\s*\(", "faltou o `if (` com a condição");
            yield return (c => Contem(c, "for-each") || Contem(c, "foreach") || c.Contains(':'), @"\bfor\s*\(\s*\w+", "faltou o for-each `for (tipo x : arr)`");
            yield return (c => Contem(c, "for"), @"\bfor\s*\(", "faltou o `for (`");
            yield return (c => Contem(c, "++") || Contem(c, "increment"), @"\+\+", "faltou o incremento `++`");
            yield return (c => Contem(c, "while") || Contem(c, "do"), @"\bwhile\s*\(", "faltou o `while (` (ou `do/while`)");
            yield return (c => Contem(c, "array") || c.Contains("[]"), @"(\[\s*\]|new\s+\w+\s*\[)", "faltou declarar um array (`int[]` ou `new tipo[]`)");
            yield return (c => Contem(c, "return"), @"\breturn\b", "faltou `return` no método");
            yield return (c => Contem(c, "new"), @"\bnew\s+\w+\s*\(", "faltou instanciar com `new`");
            yield return (c => Contem(c, "class"), @"\bclass\s+\w+", "faltou declarar uma `class`");
            yield return (c => Contem(c, "catch"), @"\bcatch\s*\(", "faltou o `catch (`");
            yield return (c => Contem(c, "try"), @"\btry\s*\{", "faltou o `try {`");
            yield return (c => Contem(c, "switch"), @"\bswitch\s*\(", "faltou o `switch (`");
            yield return (c => Contem(c, "case"), @"\bcase\b", "faltou pelo menos dois `case`");
            yield return (c => Contem(c, "default"), @"\bdefault\s*:", "faltou o `default:`");
            yield return (c => c.Contains("&&") || c.Contains("||"), @"&&|\|\|", "faltou o operador lógico `&&` ou `||`");
            yield return (c => Contem(c, "1") && Contem(c, "5"), @"(=\s*1\b|<=\s*5\b|<\s*6\b)", "faltou o `for` de 1 até 5");
            yield break;
        }

        yield return (c => Contem(c, "main") || Contem(c, "estático") || Contem(c, "estatico"), @"static\s+void\s+main\s*\(", "faltou `static void Main(...)`");
        yield return (c => Contem(c, "writeline") || Contem(c, "console"), @"console\.writeline\s*\(", "faltou `Console.WriteLine` para imprimir");
        yield return (c => Contem(c, "readline"), @"console\.readline", "faltou `Console.ReadLine` para ler a entrada");
        yield return (c => c.Contains('*') || Contem(c, "operador") || (Contem(c, "4") && Contem(c, "5")), @"\*", "faltou o operador `*` (por exemplo 4 * 5)");
        yield return (c => Contem(c, "herança") || Contem(c, "heranca") || (Contem(c, "class") && c.Contains(':')), @"\bclass\s+\w+\s*:\s*\w+", "faltou a herança `class Filha : Pai`");
        yield return (c => Contem(c, "class"), @"\bclass\s+\w+", "faltou declarar uma `class`");
        yield return (c => Contem(c, "return"), @"\breturn\b", "faltou `return` no método");
        yield return (c => Contem(c, "new"), @"\bnew\s+\w+\s*\(", "faltou instanciar com `new Classe()`");
        yield return (c => Contem(c, "foreach"), @"\bforeach\s*\(", "faltou o `foreach (`");
        yield return (c => Contem(c, "for"), @"\bfor\s*\(", "faltou o `for (`");
        yield return (c => Contem(c, "++") || Contem(c, "increment"), @"\+\+", "faltou o incremento `++`");
        yield return (c => Contem(c, "else"), @"\belse\b", "faltou o `else`");
        yield return (c => Contem(c, "if") && (c.Contains("&&") || c.Contains("||")), @"\bif\s*\(.*(&&|\|\|)", "faltou um `if` com `&&` ou `||`");
        yield return (c => Contem(c, "if"), @"\bif\s*\(", "faltou o `if (`");
        yield return (c => Contem(c, "catch"), @"\bcatch\s*\(", "faltou o `catch (`");
        yield return (c => Contem(c, "try"), @"\btry\s*\{", "faltou o `try {`");
        yield return (c => Contem(c, "switch"), @"\bswitch\s*\(", "faltou o `switch (`");
        yield return (c => Contem(c, "case"), @"\bcase\b", "faltou pelo menos dois `case`");
        yield return (c => Contem(c, "default"), @"\bdefault\s*:", "faltou o `default:`");
        yield return (c => Contem(c, "do"), @"\bdo\s*\{", "faltou o `do {` do menu");
        yield return (c => Contem(c, "while"), @"\bwhile\s*\(", "faltou o `while (`");
        yield return (c => Contem(c, "get") || Contem(c, "set") || Contem(c, "propriedade"), @"\bget\b.*\bset\b|\bset\b.*\bget\b", "faltou a propriedade com `{ get; set; }`");
        yield return (c => c.Contains("&&") || c.Contains("||"), @"&&|\|\|", "faltou o operador lógico `&&` ou `||`");
        yield return (c => Contem(c, "in"), @"\bin\b", "faltou o `in` no foreach");
        yield return (c => Contem(c, "1") && Contem(c, "5"), @"(=\s*1\b|<=\s*5\b|<\s*6\b)", "faltou o `for` começando em 1 e indo até 5");
    }

    private static bool Contem(string texto, string trecho) =>
        texto.Contains(trecho, StringComparison.OrdinalIgnoreCase);

    private static string Decapitalizar(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return texto;
        if (texto.StartsWith("faltou ", StringComparison.OrdinalIgnoreCase))
            return texto;
        return char.ToLowerInvariant(texto[0]) + texto[1..];
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
