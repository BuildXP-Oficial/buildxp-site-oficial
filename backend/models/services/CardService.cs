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

    // edita dados básicos do card
    public async Task<bool> EditarAsync(int id, SkillCard dados)
    {
        var card = await _context.SkillCards.FindAsync(id);
        if (card is null) return false;

        // atualiza só os campos que o dashboard pode mudar
        card.Titulo = dados.Titulo;
        card.Icone = dados.Icone;
        card.Classe = dados.Classe;
        card.Raridade = dados.Raridade;
        card.CorBorda = dados.CorBorda;
        card.Descricao = dados.Descricao;
        card.Ordem = dados.Ordem;
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