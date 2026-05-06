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
            _ => "#39d353",
        };
    }

    public void AplicarPayload(SkillCard card, CardDashboardPayload p)
    {
        var theme = string.IsNullOrWhiteSpace(p.Theme) ? "git" : p.Theme!.Trim();
        if (!string.IsNullOrWhiteSpace(p.Slug))
            card.Slug = p.Slug!.Trim().ToLowerInvariant();
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
        card.CorBorda = CorParaTema(theme);
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
        var card = new SkillCard();
        AplicarPayload(card, payload);
        if (string.IsNullOrWhiteSpace(card.Slug))
            throw new InvalidOperationException("Slug é obrigatório.");
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