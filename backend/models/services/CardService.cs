using System.Text.RegularExpressions;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public class CardService
{
    private readonly AppDbContext _context;

    public CardService(AppDbContext context)
    {
        _context = context;
    }

    private static string CorParaTema(string? theme)
    {
        if (string.IsNullOrWhiteSpace(theme)) return "#39d353";
        return theme.Trim().ToLowerInvariant() switch
        {
            "git" => "#39d353",
            "docker" => "#2496ed",
            "npm" => "#cb3837",
            "dotnet" => "#512bd4",
            "api" => "#22d3ee",
            _ => "#39d353",
        };
    }

    /// <summary>Normaliza #rgb ou #rrggbb para #rrggbb minúsculo (limite BD: 7 caracteres).</summary>
    private static bool TryNormalizeHexColor(string? input, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(input)) return false;
        var s = input.Trim();
        if (s.StartsWith("#", StringComparison.Ordinal))
            s = s[1..];
        if (s.Length == 3 && Regex.IsMatch(s, "^[0-9a-fA-F]{3}$"))
        {
            normalized = $"#{s[0]}{s[0]}{s[1]}{s[1]}{s[2]}{s[2]}".ToLowerInvariant();
            return true;
        }

        if (s.Length == 6 && Regex.IsMatch(s, "^[0-9a-fA-F]{6}$"))
        {
            normalized = "#" + s.ToLowerInvariant();
            return true;
        }

        return false;
    }

    /// <summary>
    /// PostgreSQL / EF aplicam HasMaxLength — URLs longas ou data URLs de ícone quebravam SaveChanges (500).
    /// Data URL em ícone: não cabe em 512 chars → fallback para logo curto (gravar PNG em wwwroot/imagens/).
    /// </summary>
    private static void AplicarLimitesColunasSkillCard(SkillCard card)
    {
        static string Clamp(string? s, int maxLen)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            var t = s.Trim();
            return t.Length <= maxLen ? t : t[..maxLen];
        }

        static string IconSrcParaBd(string? s)
        {
            const int max = 512;
            const string fallback = "imagens/logo2buildxpret.png";
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            var t = s.Trim();
            if (t.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && t.Length > max)
                return fallback;
            return t.Length <= max ? t : t[..max];
        }

        const int maxLen = 512;

        card.Slug = Clamp(card.Slug, 48);
        card.Theme = string.IsNullOrWhiteSpace(card.Theme) ? "git" : Clamp(card.Theme, 32);
        card.Titulo = Clamp(card.Titulo, 120);
        card.Raridade = Clamp(card.Raridade, 32);
        card.Classe = Clamp(card.Classe, 60);
        var cb = Clamp(card.CorBorda, 7);
        card.CorBorda = cb.Length == 7 && cb.StartsWith("#", StringComparison.Ordinal) ? cb : "#39d353";
        card.LinkBeginner = Clamp(card.LinkBeginner, maxLen);
        card.LinkRef = Clamp(card.LinkRef, maxLen);
        card.BtnPrimaryLabel = Clamp(card.BtnPrimaryLabel, 80);
        card.BtnSecondaryLabel = Clamp(card.BtnSecondaryLabel, 80);
        card.IconLayout = string.IsNullOrWhiteSpace(card.IconLayout) ? "single" : Clamp(card.IconLayout, 16);
        card.IconPrimarySrc = IconSrcParaBd(card.IconPrimarySrc);
        card.IconSecondarySrc = IconSrcParaBd(card.IconSecondarySrc);
        card.IconPrimaryAlt = Clamp(card.IconPrimaryAlt, 200);
        card.IconSecondaryAlt = Clamp(card.IconSecondaryAlt, 200);
        card.Icone = !string.IsNullOrEmpty(card.IconPrimarySrc)
            ? card.IconPrimarySrc
            : Clamp(card.Icone, maxLen);
    }

    public void AplicarPayload(SkillCard card, CardDashboardPayload p)
    {
        var theme = string.IsNullOrWhiteSpace(p.Theme) ? "git" : p.Theme!.Trim();
        if (!string.IsNullOrWhiteSpace(p.Slug))
        {
            var rawSlug = p.Slug.Trim().ToLowerInvariant();
            if (Regex.IsMatch(rawSlug, @"^\d+$"))
                throw new InvalidOperationException(
                    "Slug não pode ser apenas números (colide com a rota /api/card/{id}). Use letras, hífen ou underscore.");
            card.Slug = rawSlug;
        }
        card.Theme = theme;
        card.Titulo = (p.DisplayName ?? card.Titulo).Trim();
        if (string.IsNullOrEmpty(card.Titulo) && !string.IsNullOrEmpty(card.Slug))
            card.Titulo = card.Slug;
        card.Raridade = (p.RarityLabel ?? card.Raridade).Trim();
        card.Classe = (p.CardClass ?? card.Classe).Trim();
        card.Descricao = p.DescriptionHtml ?? card.Descricao;
        card.LinkBeginner = (p.LinkBeginner ?? card.LinkBeginner).Trim();
        card.LinkRef = (p.LinkRef ?? card.LinkRef).Trim();
        card.BtnPrimaryLabel = (p.BtnPrimaryLabel ?? card.BtnPrimaryLabel).Trim();
        card.BtnSecondaryLabel = (p.BtnSecondaryLabel ?? card.BtnSecondaryLabel).Trim();
        card.IconLayout = string.IsNullOrWhiteSpace(p.IconLayout) ? card.IconLayout : p.IconLayout!.Trim();
        var pri = (p.IconPrimarySrc ?? card.IconPrimarySrc).Trim();
        card.IconPrimarySrc = pri;
        card.Icone = pri.Length > 0 ? pri : card.Icone;
        card.IconPrimaryAlt = (p.IconPrimaryAlt ?? card.IconPrimaryAlt).Trim();
        var sec = (p.IconSecondarySrc ?? card.IconSecondarySrc).Trim();
        card.IconSecondarySrc = sec;
        card.IconSecondaryAlt = (p.IconSecondaryAlt ?? card.IconSecondaryAlt).Trim();
        if (p.XpCurrent is int xpc) card.XpAtual = xpc;
        if (p.XpMax is int xpm) card.XpMaximo = xpm;
        if (p.SortOrder is int so) card.Ordem = so;
        if (p.IsPublished is bool pub) card.Ativo = pub;
        if (TryNormalizeHexColor(p.BorderColor, out var hex))
            card.CorBorda = hex;
        else
            card.CorBorda = CorParaTema(theme);

        // Página pública única (card.html); links vazios ou legado *.html → card.html?slug=…&tab=…
        if (!string.IsNullOrWhiteSpace(card.Slug))
        {
            var sl = card.Slug.Trim().ToLowerInvariant();
            card.LinkBeginner = CardClientDto.NormalizePublicListLink(card.LinkBeginner, sl, "beginner");
            card.LinkRef = CardClientDto.NormalizePublicListLink(card.LinkRef, sl, "ref");
        }

        AplicarLimitesColunasSkillCard(card);
    }

    private async Task<string> GerarSlugUnicoAsync()
    {
        for (var i = 0; i < 40; i++)
        {
            var g = Guid.NewGuid().ToString("n");
            var candidate = $"card-{g}".Length <= 48 ? $"card-{g}" : $"card-{g}"[..48];
            var taken = await _context.SkillCards.AsNoTracking().AnyAsync(c => c.Slug == candidate);
            if (!taken) return candidate;
        }

        throw new InvalidOperationException("Não foi possível gerar um slug único.");
    }

    private async Task AssertSlugDisponivelAsync(SkillCard card, CardDashboardPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.Slug)) return;
        var desired = payload.Slug.Trim().ToLowerInvariant();
        if (desired == card.Slug) return;
        if (string.IsNullOrEmpty(desired))
            throw new InvalidOperationException("Slug não pode ficar vazio.");
        var taken = await _context.SkillCards.AnyAsync(c => c.Slug == desired && c.Id != card.Id);
        if (taken)
            throw new InvalidOperationException("Este slug já está em uso por outro card.");
    }

    // lista cards ativos — página pública do site
    public async Task<List<SkillCard>> ListarAtivosAsync()
    {
        return await _context.SkillCards
            .Where(c => c.Ativo)
            .OrderBy(c => c.Ordem)
            .ToListAsync();
    }

    // lista todos os cards — dashboard (ativos e inativos)
    public async Task<List<SkillCard>> ListarTodosAsync()
    {
        return await _context.SkillCards
            .OrderBy(c => c.Ordem)
            .ToListAsync();
    }

    // busca card completo com slides e referências
    public async Task<SkillCard?> BuscarPorIdAsync(int id)
    {
        return await _context.SkillCards
            .Include(c => c.Slides)
                .ThenInclude(s => s.Conteudos)
            .Include(c => c.Referencias)
            .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
    }

    /// <summary>Card público por slug (só ativos).</summary>
    public async Task<SkillCard?> BuscarPorSlugAsync(string slug)
    {
        var s = slug.Trim().ToLowerInvariant();
        return await _context.SkillCards
            .Include(c => c.Slides)
                .ThenInclude(s => s.Conteudos)
            .Include(c => c.Referencias)
            .FirstOrDefaultAsync(c => c.Ativo && c.Slug == s);
    }

    /// <summary>Painel: card por slug incluindo não publicados (<see cref="SkillCard.Ativo"/> false).</summary>
    public async Task<SkillCard?> BuscarPorSlugParaEdicaoAsync(string slug)
    {
        var s = slug.Trim().ToLowerInvariant();
        return await _context.SkillCards
            .Include(c => c.Slides)
                .ThenInclude(sl => sl.Conteudos)
            .Include(c => c.Referencias)
            .FirstOrDefaultAsync(c => c.Slug == s);
    }

    public async Task<int?> ResolverIdPorSlugAsync(string slug)
    {
        var s = slug.Trim().ToLowerInvariant();
        var id = await _context.SkillCards.AsNoTracking()
            .Where(c => c.Slug == s)
            .Select(c => (int?)c.Id)
            .FirstOrDefaultAsync();
        return id;
    }

    // cria um novo card
    public async Task<SkillCard> CriarAsync(SkillCard card)
    {
        card.CriadoEm = DateTime.UtcNow;
        card.AtualizadoEm = DateTime.UtcNow;
        card.XpAtual = 0; // começa sem XP — vai crescer com slides e referências

        _context.SkillCards.Add(card);
        await _context.SaveChangesAsync();
        return card;
    }

    public async Task<SkillCard> CriarDoPayloadAsync(CardDashboardPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.Slug))
            payload.Slug = await GerarSlugUnicoAsync();

        var card = new SkillCard();
        AplicarPayload(card, payload);
        if (string.IsNullOrWhiteSpace(card.Slug))
            card.Slug = await GerarSlugUnicoAsync();
        card.CriadoEm = DateTime.UtcNow;
        card.AtualizadoEm = DateTime.UtcNow;
        if (card.XpMaximo <= 0) card.XpMaximo = 3000;
        _context.SkillCards.Add(card);
        await _context.SaveChangesAsync();
        return card;
    }

    // edita dados básicos do card
    public async Task<bool> EditarAsync(int id, CardDashboardPayload payload)
    {
        var card = await _context.SkillCards.FindAsync(id);
        if (card is null) return false;

        await AssertSlugDisponivelAsync(card, payload);

        AplicarPayload(card, payload);
        card.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EditarPorSlugAsync(string slug, CardDashboardPayload payload)
    {
        var s = slug.Trim().ToLowerInvariant();
        var card = await _context.SkillCards.FirstOrDefaultAsync(c => c.Slug == s);
        if (card is null) return false;

        await AssertSlugDisponivelAsync(card, payload);

        AplicarPayload(card, payload);
        card.AtualizadoEm = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // desativa card — soft delete
    public async Task<bool> DesativarAsync(int id)
    {
        var card = await _context.SkillCards.FindAsync(id);
        if (card is null) return false;

        card.Ativo = false;
        card.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // recalcula XP do card baseado nos slides e referências
    public async Task RecalcularXpAsync(int cardId)
    {
        var card = await _context.SkillCards.FindAsync(cardId);
        if (card is null) return;

        // conta quantos slides e referências o card tem
        var totalSlides = await _context.Slides
            .CountAsync(s => s.CardId == cardId);

        var totalReferencias = await _context.ReferenciasRapidas
            .CountAsync(r => r.CardId == cardId);

        // fórmula: cada slide vale 150 XP, cada referência vale 50 XP
        var xp = (totalSlides * 150) + (totalReferencias * 50);

        // Math.Min garante que nunca passa do teto de 3000
        card.XpAtual = Math.Min(xp, 3000);
        card.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    // adiciona slide ao card
    public async Task<Slide> AdicionarSlideAsync(Slide slide)
    {
        _context.Slides.Add(slide);
        await _context.SaveChangesAsync();

        // recalcula XP após adicionar
        await RecalcularXpAsync(slide.CardId);
        return slide;
    }

    // edita um slide
    public async Task<bool> EditarSlideAsync(int id, Slide dados)
    {
        var slide = await _context.Slides.FindAsync(id);
        if (slide is null) return false;

        slide.Titulo = dados.Titulo;
        slide.Descricao = dados.Descricao;
        slide.Ordem = dados.Ordem;

        await _context.SaveChangesAsync();
        return true;
    }

    // remove um slide
    public async Task<bool> RemoverSlideAsync(int id)
    {
        var slide = await _context.Slides.FindAsync(id);
        if (slide is null) return false;

        var cardId = slide.CardId; // salva antes de remover
        _context.Slides.Remove(slide);
        await _context.SaveChangesAsync();

        // recalcula XP após remover
        await RecalcularXpAsync(cardId);
        return true;
    }

    // adiciona referência rápida (cheat code)
    public async Task<ReferenciaRapida> AdicionarReferenciaAsync(ReferenciaRapida referencia)
    {
        _context.ReferenciasRapidas.Add(referencia);
        await _context.SaveChangesAsync();

        await RecalcularXpAsync(referencia.CardId);
        return referencia;
    }

    // remove referência rápida
    public async Task<bool> RemoverReferenciaAsync(int id)
    {
        var ref_ = await _context.ReferenciasRapidas.FindAsync(id);
        if (ref_ is null) return false;

        var cardId = ref_.CardId;
        _context.ReferenciasRapidas.Remove(ref_);
        await _context.SaveChangesAsync();

        await RecalcularXpAsync(cardId);
        return true;
    }
}