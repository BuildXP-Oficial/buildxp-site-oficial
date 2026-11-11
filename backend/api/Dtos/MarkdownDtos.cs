namespace BuildXP.API.Services;

public sealed class MarkdownRegisterRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public int SecurityQuestionId { get; set; }
    public string SecurityAnswer { get; set; } = string.Empty;
}

public sealed class MarkdownLoginRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public sealed class MarkdownRecoverRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string SecurityAnswer { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}

public sealed class MarkdownDocSaveRequest
{
    public string? Titulo { get; set; }
    public string? ConteudoMarkdown { get; set; }
    public string? Pitch { get; set; }
    public string? Arquitetura { get; set; }
    public string? RegrasEvento { get; set; }
}

public sealed class MarkdownShareRequest
{
    /// <summary>novo | atualizar | despublicar | republicar | excluir. Legacy: use Compartilhado.</summary>
    public string? Acao { get; set; }
    public int? TemplateId { get; set; }
    public string? TituloModelo { get; set; }
    public string? Descricao { get; set; }
    /// <summary>Markdown revisto pelo autor no modal "Preparar modelo". O servidor ainda aplica scrub de PII.</summary>
    public string? ConteudoMarkdown { get; set; }
    /// <summary>Compat: true = publicar novo; false = despublicar TemplateId (ou o mais recente).</summary>
    public bool? Compartilhado { get; set; }
}

public sealed class MarkdownTemplateStatusRequest
{
    public bool Ativo { get; set; }
}

public sealed class MarkdownXpAwardDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Points { get; set; }
}
