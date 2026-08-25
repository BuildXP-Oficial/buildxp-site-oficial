using System.Text;
using System.Text.RegularExpressions;

namespace BuildXP.API.Services;

public sealed class MarkdownAnonReplacementDto
{
    public string Id { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Original { get; set; } = string.Empty;
    public string Suggested { get; set; } = string.Empty;
    public int Line { get; set; }
}

/// <summary>
/// Anonimiza README para partilha: preserva tema/estrutura (títulos, HTML, imagens, listas)
/// e substitui texto pessoal / dados sensíveis por placeholders.
/// </summary>
public static class MarkdownTemplateAnonymizer
{
    public const string PlaceholderParagraph = "Descreva aqui o seu projeto em uma ou duas frases.";
    public const string PlaceholderListItem = "Item de exemplo";
    public const string PlaceholderCell = "Exemplo";
    public const string PlaceholderUser = "{{seu-usuario}}";
    public const string PlaceholderEmail = "{{seu-email}}";
    public const string PlaceholderLinkedIn = "{{seu-linkedin}}";
    public const string PlaceholderProject = "{{nome-do-projeto}}";

    private static readonly HashSet<string> GenericListWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "instalação", "instalacao", "pré-requisitos", "pre-requisitos", "prerequisites",
        "sobre", "about", "features", "contato", "contact", "tecnologias", "tech",
        "stack", "skills", "projetos", "projects", "educação", "educacao", "education",
        "experiência", "experiencia", "experience", "links", "badges", "demo", "docs",
        "changelog", "licença", "licenca", "license", "contribuição", "contribuicao",
        "frontend", "backend", "tools", "ferramentas", "api", "database", "mobile",
    };

    public static (string Markdown, List<MarkdownAnonReplacementDto> Replacements) Anonymize(
        string? markdown,
        string? usuario,
        string? nome)
    {
        var userKey = (usuario ?? string.Empty).Trim();
        var nameKey = (nome ?? string.Empty).Trim();
        var lines = (markdown ?? string.Empty).Replace("\r\n", "\n").Split('\n');
        var outLines = new string[lines.Length];
        var replacements = new List<MarkdownAnonReplacementDto>();
        var rid = 0;
        var inCode = false;

        string NextId() => $"r{++rid}";

        void ReplaceLine(int i, string kind, string original, string suggested)
        {
            if (string.Equals(original, suggested, StringComparison.Ordinal))
            {
                outLines[i] = original;
                return;
            }
            outLines[i] = suggested;
            replacements.Add(new MarkdownAnonReplacementDto
            {
                Id = NextId(),
                Kind = kind,
                Original = original,
                Suggested = suggested,
                Line = i + 1,
            });
        }

        for (var i = 0; i < lines.Length; i++)
        {
            var line = lines[i];

            if (Regex.IsMatch(line, @"^```"))
            {
                inCode = !inCode;
                outLines[i] = line;
                continue;
            }

            if (inCode)
            {
                var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var changed);
                if (changed)
                    ReplaceLine(i, "code", line, scrubbed);
                else
                    outLines[i] = line;
                continue;
            }

            if (string.IsNullOrWhiteSpace(line) ||
                Regex.IsMatch(line, @"^(-{3,}|\*{3,}|_{3,})\s*$") ||
                Regex.IsMatch(line, @"^\s*<!--"))
            {
                outLines[i] = line;
                continue;
            }

            // Headings — preservar (só scrub dados pessoais no título)
            if (Regex.IsMatch(line, @"^#{1,6}\s+\S"))
            {
                var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var changed);
                if (changed) ReplaceLine(i, "heading_pii", line, scrubbed);
                else outLines[i] = line;
                continue;
            }

            // Imagens markdown / badges — preservar estrutura, scrub user na URL
            if (Regex.IsMatch(line, @"!\[[^\]]*\]\([^)]+\)") ||
                Regex.IsMatch(line, @"^\s*<img\b", RegexOptions.IgnoreCase))
            {
                var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var changed);
                if (changed) ReplaceLine(i, "media", line, scrubbed);
                else outLines[i] = line;
                continue;
            }

            // Checklist / listas
            var listMatch = Regex.Match(line, @"^(\s*(?:[-*]|\d+\.)\s+(?:\[[ xX]\]\s+)?)(.+)$");
            if (listMatch.Success)
            {
                var prefix = listMatch.Groups[1].Value;
                var content = listMatch.Groups[2].Value.Trim();
                var scrubbed = ScrubPersonalAndUrls(content, userKey, nameKey, out var pii);
                string body;
                if (ShouldKeepListContent(content) && !pii)
                    body = content;
                else if (pii)
                    body = ShouldKeepListContent(StripPlaceholders(scrubbed)) || scrubbed.Length <= 48
                        ? scrubbed
                        : PlaceholderListItem;
                else
                    body = PlaceholderListItem;
                var suggested = prefix + body;
                if (string.Equals(line, suggested, StringComparison.Ordinal))
                    outLines[i] = line;
                else
                    ReplaceLine(i, "list", line, suggested);
                continue;
            }

            // Tabela
            if (line.TrimStart().StartsWith('|') && line.Contains('|'))
            {
                if (Regex.IsMatch(line, @"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$"))
                {
                    outLines[i] = line; // separator
                    continue;
                }
                // header vs body: se linha anterior era separator ou isto é a primeira de um bloco, manter cabeçalho
                var isHeader = i + 1 < lines.Length &&
                    Regex.IsMatch(lines[i + 1], @"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$");
                if (isHeader)
                {
                    var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var changed);
                    if (changed) ReplaceLine(i, "table_header", line, scrubbed);
                    else outLines[i] = line;
                }
                else
                {
                    var cells = SplitTableCells(line);
                    var newCells = cells.Select(c =>
                    {
                        var t = c.Trim();
                        if (string.IsNullOrEmpty(t) || t is "-" or "—" or "…") return c;
                        var s = ScrubPersonalAndUrls(t, userKey, nameKey, out _);
                        return string.IsNullOrWhiteSpace(StripPlaceholders(s)) || s.Contains("{{")
                            ? s
                            : PlaceholderCell;
                    }).ToList();
                    var suggested = JoinTableCells(line, newCells);
                    ReplaceLine(i, "table_cell", line, suggested);
                }
                continue;
            }

            // HTML estrutural com texto interior
            if (Regex.IsMatch(line, @"^\s*</?[a-zA-Z]"))
            {
                var suggested = AnonymizeHtmlLine(line, userKey, nameKey, out var changed);
                if (changed) ReplaceLine(i, "html", line, suggested);
                else outLines[i] = line;
                continue;
            }

            // Blockquote
            if (line.TrimStart().StartsWith('>'))
            {
                var prefix = Regex.Match(line, @"^(\s*>\s*)").Groups[1].Value;
                var rest = line[prefix.Length..].Trim();
                if (string.IsNullOrEmpty(rest) || Regex.IsMatch(rest, @"^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$", RegexOptions.IgnoreCase))
                {
                    outLines[i] = line;
                }
                else
                {
                    var scrubbed = ScrubPersonalAndUrls(rest, userKey, nameKey, out var pii);
                    var suggested = prefix + (pii ? scrubbed : PlaceholderParagraph);
                    if (!pii) suggested = prefix + PlaceholderParagraph;
                    ReplaceLine(i, "quote", line, suggested);
                }
                continue;
            }

            // Parágrafo / texto corrido
            {
                var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var pii);
                // Links-only lines (estrutura de contacto) — scrub URLs, manter markdown link shape
                if (Regex.IsMatch(line.Trim(), @"^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$"))
                {
                    if (pii) ReplaceLine(i, "link", line, scrubbed);
                    else outLines[i] = line;
                    continue;
                }
                var suggested = PlaceholderParagraph;
                if (pii && scrubbed.Contains("{{") && scrubbed.Length < 80)
                    suggested = scrubbed;
                ReplaceLine(i, "paragraph", line, suggested);
            }
        }

        return (string.Join("\n", outLines), replacements);
    }

    /// <summary>Aplica overrides do autor (reverter ou editar) e força scrub final de PII.</summary>
    public static string ApplyReviewedMarkdown(
        string originalMarkdown,
        string? reviewedMarkdown,
        string? usuario,
        string? nome)
    {
        var source = string.IsNullOrWhiteSpace(reviewedMarkdown) ? originalMarkdown : reviewedMarkdown;
        var (anon, _) = Anonymize(originalMarkdown, usuario, nome);
        // Se o autor enviou revisão, usa-a mas sempre remove PII restantes
        var final = string.IsNullOrWhiteSpace(reviewedMarkdown) ? anon : reviewedMarkdown!;
        return ScrubPersonalAndUrls(final, (usuario ?? "").Trim(), (nome ?? "").Trim(), out _);
    }

    public static string BuildCardPreview(string? descricao, string? markdown, int max = 140)
    {
        if (!string.IsNullOrWhiteSpace(descricao))
            return Truncate(descricao.Trim(), max);

        var lines = (markdown ?? string.Empty).Replace("\r\n", "\n").Split('\n');
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (string.IsNullOrEmpty(line) || line.StartsWith("<!--")) continue;
            if (Regex.IsMatch(line, @"^```")) continue;
            if (Regex.IsMatch(line, @"^#{1,6}\s+(.+)$"))
            {
                var h = Regex.Match(line, @"^#{1,6}\s+(.+)$").Groups[1].Value.Trim();
                h = Regex.Replace(h, "<[^>]+>", "").Trim();
                if (!string.IsNullOrWhiteSpace(h)) return Truncate(h, max);
            }
        }

        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (string.IsNullOrEmpty(line)) continue;
            if (line.StartsWith('<') || line.StartsWith('#') || line.StartsWith('|') ||
                line.StartsWith('-') || line.StartsWith('*') || line.StartsWith('>') ||
                line.StartsWith("```"))
                continue;
            return Truncate(line, max);
        }

        return "Modelo README da comunidade";
    }

    private static bool ShouldKeepListContent(string content)
    {
        var t = content.Trim().TrimEnd('.', '!', '?');
        if (t.Length <= 28 && !t.Contains(' '))
            return true;
        if (GenericListWords.Contains(t))
            return true;
        var words = t.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Length <= 3 && words.All(w => GenericListWords.Contains(w) || w.Length <= 12);
    }

    private static string StripPlaceholders(string s) =>
        Regex.Replace(s, @"\{\{[^}]+\}\}", "").Trim();

    private static List<string> SplitTableCells(string line)
    {
        var t = line.Trim();
        if (t.StartsWith('|')) t = t[1..];
        if (t.EndsWith('|')) t = t[..^1];
        return t.Split('|').Select(c => c).ToList();
    }

    private static string JoinTableCells(string original, List<string> cells)
    {
        var core = string.Join(" | ", cells.Select(c => c.Trim()));
        var lead = original.TrimStart().StartsWith('|') ? "| " : "";
        var trail = original.TrimEnd().EndsWith('|') ? " |" : "";
        return lead + core + trail;
    }

    private static string AnonymizeHtmlLine(string line, string userKey, string nameKey, out bool changed)
    {
        changed = false;
        var scrubbed = ScrubPersonalAndUrls(line, userKey, nameKey, out var pii);
        if (pii)
        {
            changed = true;
            line = scrubbed;
        }

        var didReplace = false;
        var result = Regex.Replace(
            line,
            @"(<(?:p|span|strong|em|b|i|td|th|li|h[1-6]|a)\b[^>]*>)([^<]+)(</(?:p|span|strong|em|b|i|td|th|li|h[1-6]|a)>)",
            m =>
            {
                var inner = m.Groups[2].Value;
                if (string.IsNullOrWhiteSpace(inner)) return m.Value;
                if (inner.Trim().Length <= 2) return m.Value;
                didReplace = true;
                return m.Groups[1].Value + PlaceholderParagraph + m.Groups[3].Value;
            },
            RegexOptions.IgnoreCase);

        if (didReplace) changed = true;
        return result;
    }

    private static string ScrubPersonalAndUrls(string input, string userKey, string nameKey, out bool changed)
    {
        var s = input ?? string.Empty;
        var before = s;

        // emails
        s = Regex.Replace(s, @"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", PlaceholderEmail);

        // telefones simples
        s = Regex.Replace(s, @"(?<!\d)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}(?!\d)", "{{seu-telefone}}");

        if (!string.IsNullOrEmpty(nameKey) && nameKey.Length >= 2)
            s = Regex.Replace(s, Regex.Escape(nameKey), PlaceholderUser, RegexOptions.IgnoreCase);

        if (!string.IsNullOrEmpty(userKey) && userKey.Length >= 2)
        {
            s = Regex.Replace(s, $@"(?<![a-zA-Z0-9_])@{Regex.Escape(userKey)}(?![a-zA-Z0-9_])", "@" + PlaceholderUser, RegexOptions.IgnoreCase);
            s = Regex.Replace(s, Regex.Escape(userKey), PlaceholderUser, RegexOptions.IgnoreCase);
            s = Regex.Replace(
                s,
                $@"(?i)(https?://)?(www\.)?github\.com/{Regex.Escape(userKey)}(/[^\s)\""']*)?",
                $"https://github.com/{PlaceholderUser}");
            s = Regex.Replace(
                s,
                $@"(?i)(https?://)?(www\.)?linkedin\.com/in/[^\s)\""'/]+",
                $"https://linkedin.com/in/{PlaceholderLinkedIn.Trim('{', '}')}");
        }

        // perfis genéricos
        s = Regex.Replace(
            s,
            @"(?i)(https?://)?(www\.)?linkedin\.com/in/[^\s)\""'/]+",
            $"https://linkedin.com/in/{PlaceholderLinkedIn.Trim('{', '}')}");
        s = Regex.Replace(
            s,
            @"(?i)(https?://)?(www\.)?instagram\.com/[^\s)\""'/]+",
            "https://instagram.com/{{seu-usuario}}");

        // git clone / repo paths
        s = Regex.Replace(
            s,
            @"(?i)(git\s+clone\s+(?:https?://)?github\.com/)([^/\s]+)(/[^\s]+)",
            m => $"{m.Groups[1].Value}{PlaceholderUser}/{PlaceholderProject}");
        s = Regex.Replace(
            s,
            @"(?i)(https://github\.com/)([^/\s]+)(/[^\s)\""']+)",
            m =>
            {
                var user = m.Groups[2].Value;
                if (user is "SEU_USER" or "{{seu-usuario}}") return m.Value;
                // não partir badges de orgs conhecidas demais — ainda assim anonimiza user/repo do autor
                return $"{m.Groups[1].Value}{PlaceholderUser}/{PlaceholderProject}";
            });

        // shields / badges com user
        s = Regex.Replace(
            s,
            @"(?i)(https://img\.shields\.io/[^\s)\""']*?/)([A-Za-z0-9_.\-]+)(/[A-Za-z0-9_.\-]+)",
            m => $"{m.Groups[1].Value}{PlaceholderUser.Trim('{', '}')}/{PlaceholderProject.Trim('{', '}')}");

        // capsule-render text com nome
        if (!string.IsNullOrEmpty(nameKey) && nameKey.Length >= 2)
            s = Regex.Replace(s, $@"(?i)(text=)([^&\s)\""']*{Regex.Escape(Uri.EscapeDataString(nameKey))}[^&\s)\""']*)", $"$1{Uri.EscapeDataString(PlaceholderUser)}");

        changed = !string.Equals(before, s, StringComparison.Ordinal);
        return s;
    }

    private static string Truncate(string s, int max) =>
        string.IsNullOrEmpty(s) ? string.Empty : (s.Length <= max ? s : s[..(max - 1)] + "…");
}
