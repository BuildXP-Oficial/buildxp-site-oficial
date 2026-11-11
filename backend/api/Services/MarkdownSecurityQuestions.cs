namespace BuildXP.API.Services;

public static class MarkdownSecurityQuestions
{
    public static readonly IReadOnlyList<(int Id, string Text)> All =
    [
        (0, "Qual seria o código secreto da sua base lunar imaginária?"),
        (1, "Em que século fictício você teria fundado a sua primeira startup?"),
        (2, "Qual era o nome do protocolo inventado no seu primeiro «sistema operacional» de brincadeira?"),
        (3, "Qual cor inexistente você usaria como tema do seu primeiro IDE?"),
        (4, "Qual seria a palavra-passe do cofre do museu que só existe na sua cabeça?"),
        (5, "Qual era o callsign da sua nave espacial inventada aos 10 anos?"),
    ];

    public static bool IsValidId(int id) => id >= 0 && id < All.Count;
}
