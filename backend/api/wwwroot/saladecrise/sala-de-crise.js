/* ============================================================
   CASOS
   step.type: point (clicar na linha), decide (escolha com consequência), report (relatório)
   evidência: at = índice do passo em que ela aparece
   decisão: primeira opção (índice 0) é a melhor; as opções são embaralhadas na tela
   fx: op = Operação, ct = Contenção, cf = Conformidade
   ============================================================ */
const CASES = [
{
 id:"rotasul", title:"Madrugada na Rota Sul", org:"Transportadora, 400 funcionários", lvl:"Difícil",
 tags:["Engenharia social","MFA","SMB","Redundância","ISO 22301","LGPD","CSF 2.0","27005","27001"],
 brief:"Sexta, 02:14. O plantonista te acorda: o servidor de arquivos FS01 está com tudo renomeado para .lockrs e há uma nota de resgate na área de trabalho. Ontem à tarde, a Carla, do financeiro, reportou um e-mail 'estranho'.",
 ev:[
  {id:"mail",name:"E-mail reportado",at:0,lines:[
   "De: RH Rota Sul <rh@rotasul-beneficios.com>",
   "Para: carla.mendes@rotasul.com.br",
   "Data: qui 16:40",
   "Assunto: URGENTE - recadastramento do vale-alimentação",
   "Olá, Carla! Seu benefício será suspenso amanhã.",
   "Confirme seu login corporativo em:",
   "hxxp://rotasul-beneficios.com/portal/login",
   "Atenciosamente, Equipe de Benefícios"]},
  {id:"siem",name:"SIEM",at:0,lines:[
   "qui 16:48  PROXY rotasul-beneficios.com  POST /portal/login  usuário=carla.mendes",
   "2024-03-11 AD   carla.mendes incluída em VPN-LEGADO (exceção de MFA 'temporária', sem prazo, sem aceite da diretoria)",
   "qui 23:40  VPN   carla.mendes  OK  origem 45.137.21.8 (NL)  MFA: não exigido",
   "qui 23:44  VPN   sessão carla.mendes -> FIN-PC07 (RDP)",
   "qui 23:58  NET   FIN-PC07 -> 10.0.5.0/24  TCP/445  312 conexões em 40 s",
   "sex 00:30  AD    svc_backup  logon em FS01 a partir de FIN-PC07",
   "sex 00:41  NET   FS01 -> 45.137.21.8  HTTPS  4,1 GB enviados",
   "sex 01:55  FS01  vssadmin delete shadows /all /quiet",
   "sex 01:58  NAS01 job 'backup-FS01' excluído por svc_backup",
   "sex 02:10  FS01  18.402 arquivos renomeados para *.lockrs"]},
  {id:"bkp",name:"Backups e réplicas",at:5,lines:[
   "FS01 (arquivos)       -> NAS01, diário 23:00, NAS no mesmo domínio AD, sempre online",
   "FS01 (arquivos)       -> nuvem imutável, semanal, último ponto: dom 03:00",
   "ERP-DB (faturamento)  -> réplica no site de DR a cada 15 min",
   "ERP-DB último ponto íntegro na réplica: qui 23:30",
   "Conta svc_backup: administradora de domínio, senha sem troca desde 2021"]},
  {id:"bia",name:"BIA",at:5,lines:[
   "Processo              RTO     RPO",
   "Faturamento (ERP)     8 h     1 h",
   "Emissão de CT-e       4 h     1 h",
   "Arquivos (FS01)       48 h    24 h",
   "Aprovada pela diretoria em 2025 no sistema de gestão de continuidade certificado"]}
 ],
 steps:[
  {type:"point",time:"02:16",text:"Antes de mexer em qualquer coisa, você quer entender a origem.",q:"Aponte a linha que mostra a Carla entregando a senha ao atacante.",ans:["siem:0"],hint:"O e-mail aponta para um domínio. Procure esse domínio em outro lugar.",why:"O proxy registrou o POST com o usuário dela no domínio falso (rotasul-beneficios.com, não rotasul.com.br). É phishing de coleta de credenciais: urgência artificial ('suspenso amanhã') e imitação de um setor interno."},
  {type:"decide",time:"02:20",text:"O diretor-geral liga: 'Desliga tudo, agora!'. A criptografia ainda está em andamento no FS01 e a sessão VPN da Carla continua ativa.",q:"O que você faz?",
   opts:[
    {t:"Derrubar a sessão VPN, desabilitar carla.mendes e svc_backup, isolar FS01 e FIN-PC07 da rede sem desligá-los e manter o resto sob monitoramento",fx:{op:-5,ct:25,cf:5},out:"A criptografia para no minuto seguinte. A memória das máquinas isoladas fica preservada para a perícia e o faturamento segue rodando."},
    {t:"Desligar fisicamente todos os servidores e o link de internet",fx:{op:-30,ct:15,cf:-5},out:"O ataque para, mas o ERP e a emissão de CT-e caem e os caminhões param no pátio. A memória RAM, com rastros do malware, se perde."},
    {t:"Esperar o expediente para decidir com a diretoria",fx:{op:-15,ct:-30,cf:-10},out:"Até as 8h, mais dois servidores são criptografados usando a conta svc_backup."},
    {t:"Formatar o FS01 e restaurar do NAS01 imediatamente",fx:{op:-10,ct:-20,cf:-5},out:"O atacante ainda tem a svc_backup e a sessão VPN. Ele volta e criptografa o servidor restaurado, e a evidência do FS01 foi destruída."}],
   why:"Contenção primeiro, com o menor impacto possível: cortar o acesso do atacante (sessões e credenciais) e isolar os hosts afetados sem desligá-los. Desligar tudo derruba a operação e destrói evidência volátil. No CSF 2.0 isso é Respond (mitigação)."},
  {type:"point",time:"03:10",text:"A perícia está montando a linha do tempo.",q:"Aponte a linha que explica por que o atacante entrou sem segundo fator.",ans:["siem:1"],hint:"O motivo é anterior à noite do ataque.",why:"Uma exceção 'temporária' de MFA, sem prazo e sem aceite formal, virou a porta de entrada. É falha de governança (Govern, no CSF 2.0): toda exceção de risco precisa de dono, prazo e aceite de quem responde pelo risco."},
  {type:"point",time:"03:25",text:"",q:"Aponte a linha que mostra a movimentação lateral.",ans:["siem:4"],hint:"Uma estação conversando com uma sub-rede inteira numa porta conhecida.",why:"312 conexões TCP/445 em 40 segundos saindo de uma estação é varredura de SMB atrás de compartilhamentos e servidores. Segmentação interna, bloqueando SMB entre estações, teria contido esse passo."},
  {type:"point",time:"03:40",text:"O jurídico pergunta se houve só criptografia ou também roubo de dados.",q:"Aponte a linha que prova exfiltração.",ans:["siem:6"],hint:"Procure volume saindo para um IP que você já viu.",why:"4,1 GB saíram para o mesmo IP da VPN maliciosa: é dupla extorsão. Isso muda o caso juridicamente, porque passa a haver provável vazamento de dados pessoais."},
  {type:"decide",time:"06:00",text:"A diretoria quer o faturamento de volta até as 14h. Chegaram o inventário de backups e a BIA.",q:"Qual plano de recuperação?",
   opts:[
    {t:"Trocar todas as credenciais privilegiadas, subir o ERP da réplica do DR (ponto de qui 23:30) em ambiente limpo, reconstruir o FS01 a partir de imagem nova e restaurar os arquivos da nuvem imutável",fx:{op:25,ct:15,cf:5},out:"O ERP volta às 12h40, dentro do RTO. O FS01 volta em 30 h, mas com quase 5 dias de arquivos perdidos."},
    {t:"Restaurar o FS01 a partir do NAS01",fx:{op:-10,ct:-5},out:"O job foi excluído e o NAS, que estava no mesmo domínio e sempre online, também foi criptografado. Horas perdidas."},
    {t:"Religar o FS01 e rodar um descriptografador encontrado em um fórum",fx:{op:-5,ct:-25,cf:-5},out:"O 'descriptografador' é outro malware. Nova infecção."},
    {t:"Negociar o resgate para obter a chave",fx:{op:5,ct:-15,cf:-15},out:"A chave recebida funciona em 60% dos arquivos, e não há garantia nenhuma de que os dados roubados foram apagados."}],
   why:"A réplica do ERP atende ao RPO (1 h) e ao RTO (8 h). Já o FS01 tinha RPO de 24 h, mas a única cópia sobrevivente era semanal: a frequência do backup não atendia à própria BIA. Cópia online no mesmo domínio não é redundância contra ransomware; cópia imutável ou offline é. Trocar credenciais antes de restaurar evita reinfecção. Isso é Recover, no CSF 2.0."},
  {type:"decide",time:"sex 10:00",text:"A perícia confirma: os 4,1 GB incluem folha de pagamento com CPF, dados bancários e atestados médicos de 900 funcionários.",q:"E a LGPD?",
   opts:[
    {t:"Comunicar a ANPD e os funcionários em até 3 dias úteis com o que já se sabe, complementando depois",fx:{cf:30},out:"A comunicação sai no prazo. A ANPD abre processo, mas registra a colaboração e a rapidez."},
    {t:"Aguardar o laudo pericial completo (uns 60 dias) para comunicar com certeza",fx:{cf:-30},out:"Quando o laudo sai, os dados já estão à venda e a ANPD considera a comunicação intempestiva."},
    {t:"Comunicar só se os dados aparecerem publicados pelo grupo criminoso",fx:{cf:-35},out:"Os dados aparecem em um site de vazamentos três semanas depois. A empresa fica sem explicação para o silêncio."},
    {t:"Avisar só os funcionários, para evitar fiscalização",fx:{cf:-20},out:"Um funcionário denuncia à ANPD. A omissão pesa na dosimetria."}],
   why:"LGPD, art. 48, e Resolução CD/ANPD nº 15/2024: incidente que possa causar risco ou dano relevante deve ser comunicado à ANPD e aos titulares em 3 dias úteis, podendo ser complementado depois. Atestados médicos são dados sensíveis e dados bancários agravam o risco."},
  {type:"report",time:"sex 18:00",text:"Hora do relatório para a diretoria. Não há segunda chance em relatório.",
   fields:[
    {l:"Técnica do acesso inicial",o:["Phishing de coleta de credenciais","Vishing","Baiting","Pretexting presencial","Tailgating"]},
    {l:"Controle que teria barrado o login de 23:40",o:["MFA obrigatório na VPN, sem exceções","IDS em porta espelhada","Carimbo do tempo nos logs","Filtro de pacotes stateless","Hash dos arquivos do FS01"]},
    {l:"Protocolo usado na propagação interna",o:["SMB (TCP/445)","SMTP (TCP/25)","DHCP (UDP/67)","ICMP","IMAP (TCP/993)"]},
    {l:"Função do CSF 2.0 em que falhou a exceção de MFA sem dono nem prazo",o:["Govern","Identify","Protect","Detect","Respond","Recover"]},
    {l:"Norma de requisitos do sistema de continuidade certificado que produziu a BIA",o:["ISO 22301","ISO 22313","ISO/IEC 27005","ISO/IEC 29134"]},
    {l:"Contratar seguro cibernético depois do incidente, segundo a ISO/IEC 27005",o:["Compartilhar o risco","Reter o risco","Evitar o risco","Modificar o risco"]},
    {l:"Cláusula da ISO/IEC 27001 que trata de não conformidade e ação corretiva",o:["10 – Melhoria","8 – Operação","9 – Avaliação de desempenho","5 – Liderança"]}],
   why:"ISO 22301 traz os requisitos (certificável); a 22313 é guia. A 27005 tem quatro opções de tratamento: modificar, reter, evitar e compartilhar. A cláusula 10 da 27001 cobre melhoria contínua, não conformidades e ações corretivas."}
 ]
},
{
 id:"clinica", title:"O Wi-Fi da Clínica Vida Plena", org:"Clínica médica, 3 unidades", lvl:"Difícil",
 tags:["Evil Twin","Rogue AP","DHCP","ARP","Sniffing","802.1X/EAP","Dados sensíveis","ISO 29134"],
 brief:"Segunda, 08:40. A diretora da clínica te liga: o Wi-Fi caiu várias vezes, apareceu uma página pedindo a senha do prontuário e agora o sistema está lento até nos computadores com cabo.",
 ev:[
  {id:"rel",name:"Relato da recepção",at:0,lines:[
   "08:05 Wi-Fi 'ClinicaVida' caiu várias vezes seguidas",
   "08:07 Ao reconectar, abriu uma página pedindo usuário e senha do prontuário",
   "08:08 Três funcionárias digitaram as credenciais",
   "08:30 Prontuário lento nas estações cabeadas da recepção",
   "Na sala 3, o técnico de ultrassom instalou 'um roteador para melhorar o sinal'"]},
  {id:"wids",name:"Varredura Wi-Fi",at:0,lines:[
   "SSID ClinicaVida   BSSID a4:5e:60:11:22:01  canal 6   WPA2-Enterprise  cadastrado",
   "SSID ClinicaVida   BSSID 5e:1a:9c:00:13:37  canal 11  aberta           NÃO cadastrado   sinal -38 dBm",
   "SSID TP-LINK_4F2A  BSSID c0:4a:00:4f:2a:10  canal 1   WPA2-PSK         NÃO cadastrado   cabeado na porta Gi0/14 (sala 3)",
   "SSID Cafe_Esquina  BSSID 1c:3b:f3:88:10:02  canal 1   WPA2-PSK         rede do vizinho",
   "08:04–08:06  1.912 quadros de desautenticação enviados aos clientes de a4:5e:60:11:22:01"]},
  {id:"dhcp",name:"Switch e DHCP",at:2,lines:[
   "08:21:02  porta Gi0/14  250 DHCPDISCOVER com MACs aleatórios em 20 s",
   "08:21:25  servidor DHCP 10.10.0.2: pool esgotado",
   "08:21:40  DHCPOFFER de 10.10.0.87  gateway=10.10.0.87  DNS=10.10.0.87",
   "08:22:10  estações da recepção renovam concessão com 10.10.0.87"]},
  {id:"arp",name:"Tabela ARP da RECEP-01",at:2,lines:[
   "10.10.0.1     00:e0:4c:68:0a:77   dinâmico",
   "10.10.0.2     3c:52:82:10:aa:01   dinâmico",
   "10.10.0.87    00:e0:4c:68:0a:77   dinâmico",
   "10.10.0.140   3c:52:82:44:19:9e   dinâmico"]}
 ],
 steps:[
  {type:"point",time:"08:42",text:"Você começa pelo que as funcionárias viram.",q:"Aponte o ponto de acesso usado para capturar as senhas.",ans:["wids:1"],hint:"Mesmo nome, mas com diferenças importantes.",why:"Mesmo SSID, rede aberta, não cadastrado e com sinal mais forte: Evil Twin. Os quadros de desautenticação derrubaram os clientes do AP legítimo, que reconectaram no gêmeo com sinal melhor, onde havia um portal falso."},
  {type:"point",time:"08:48",text:"",q:"Aponte o dispositivo que é um Rogue AP, e não um Evil Twin.",ans:["wids:2"],hint:"O Rogue AP está dentro da sua infraestrutura.",why:"O TP-LINK foi ligado à rede interna, na porta Gi0/14, sem autorização: Rogue AP, uma porta dos fundos. O Evil Twin fica fora da sua infraestrutura, imitando a rede. A rede do café é só vizinhança."},
  {type:"point",time:"09:05",text:"Chegaram os logs do switch e a tabela ARP de uma estação da recepção.",q:"Aponte a linha que mostra a preparação para o servidor DHCP falso.",ans:["dhcp:0"],hint:"Antes de oferecer endereços, o atacante precisa tirar o servidor legítimo do jogo.",why:"250 pedidos com MACs aleatórios em 20 s esgotam o pool legítimo: DHCP starvation. Em seguida, o servidor falso (10.10.0.87) entrega a si mesmo como gateway e DNS. Repare que a porta é a Gi0/14, a mesma do Rogue AP: o atacante entrou por ele."},
  {type:"point",time:"09:12",text:"Algumas estações não renovaram a concessão, mas também estão lentas.",q:"Aponte a linha que prova envenenamento ARP na RECEP-01.",ans:["arp:0","arp:2"],hint:"Compare os endereços MAC.",why:"O gateway 10.10.0.1 e o host 10.10.0.87 aparecem com o mesmo MAC: o notebook do atacante responde pelos dois. É ARP spoofing para ficar no meio da comunicação (MITM) e depois capturar o tráfego do prontuário."},
  {type:"decide",time:"09:15",text:"O atacante ainda está na rede e as três credenciais roubadas continuam válidas.",q:"Qual contenção?",
   opts:[
    {t:"Desligar a porta Gi0/14 e recolher o equipamento da sala 3, ativar DHCP snooping e Dynamic ARP Inspection, bloquear as três contas e forçar troca de senha",fx:{op:-5,ct:25,cf:5},out:"Em 20 minutos o tráfego volta ao gateway verdadeiro e as credenciais roubadas deixam de funcionar."},
    {t:"Trocar a senha do Wi-Fi 'ClinicaVida'",fx:{ct:-15},out:"A rede legítima é WPA2-Enterprise, não tem uma senha única. O gêmeo e o notebook continuam lá."},
    {t:"Desligar a rede inteira da clínica até segunda-feira",fx:{op:-30,ct:10},out:"Pacientes sem atendimento. E as senhas roubadas continuam válidas no prontuário web."},
    {t:"Bloquear ICMP no firewall",fx:{ct:-10},out:"Nada muda: o ataque não depende de ICMP."}],
   why:"Tirar o atacante da rede (porta e equipamento), neutralizar os dois ataques de camada 2 com DHCP snooping e DAI, e invalidar as credenciais comprometidas. Desligar tudo não resolve as senhas vazadas."},
  {type:"decide",time:"11:00",text:"O log do prontuário mostra que uma das credenciais roubadas foi usada às 08:50 para exportar laudos de 12 mil pacientes.",q:"Como tratar?",
   opts:[
    {t:"Tratar como incidente com dados sensíveis: avaliar o risco, comunicar a ANPD e os pacientes no prazo e documentar tudo",fx:{cf:30},out:"A ANPD recebe a comunicação no prazo, com medidas já adotadas."},
    {t:"Não comunicar: provavelmente foi só um técnico curioso",fx:{cf:-30},out:"Semanas depois, pacientes recebem golpes citando seus exames."},
    {t:"Comunicar só o conselho de medicina",fx:{cf:-20},out:"O conselho não substitui a ANPD nem os titulares."},
    {t:"Publicar nota dizendo que nenhum dado foi acessado",fx:{cf:-35},out:"O log desmente a nota. Além do incidente, agora há falta de transparência."}],
   why:"Dados de saúde são dados pessoais sensíveis (LGPD, art. 5º, II). A exportação por credencial roubada caracteriza incidente com risco relevante: comunicação à ANPD e aos titulares no prazo regulamentado."},
  {type:"decide",time:"ter 14:00",text:"A diretoria aprova orçamento para um plano de 90 dias.",q:"O que implantar?",
   opts:[
    {t:"802.1X com EAP-TLS no cabo e no Wi-Fi, WIPS para detectar APs não cadastrados, quadros de gerenciamento protegidos (802.11w), HTTPS no prontuário e MFA",fx:{ct:25,cf:10},out:"Nenhum dispositivo sem certificado da clínica consegue porta nem Wi-Fi. APs estranhos geram alerta."},
    {t:"Filtrar acesso por endereço MAC e esconder o SSID",fx:{ct:-15},out:"MAC aparece em qualquer captura e é clonado em segundos; SSID oculto também aparece."},
    {t:"Trocar para WPA2-PSK com uma senha longa compartilhada",fx:{ct:-10},out:"A senha vaza na primeira troca de funcionário e não impede Rogue AP no cabo."},
    {t:"Instalar antivírus nas estações",fx:{ct:-5},out:"Útil, mas não trata nenhum dos ataques de rede que aconteceram."}],
   why:"802.1X com EAP-TLS autentica cada dispositivo por certificado, dos dois lados, antes de liberar a porta ou o Wi-Fi (suplicante, autenticador e servidor RADIUS). O 802.11w protege contra desautenticação forjada; o WIPS detecta gêmeos e rogues."},
  {type:"report",time:"qua 10:00",text:"Relatório técnico para o comitê de privacidade.",
   fields:[
    {l:"Os quadros de desautenticação serviram para",o:["Forçar os clientes a reconectarem no AP falso","Interferir na frequência (jamming)","Distribuir endereços IP","Cifrar o tráfego do atacante"]},
    {l:"O envenenamento ARP é um ataque",o:["Ativo","Passivo"]},
    {l:"A captura das senhas no tráfego, isoladamente, é",o:["Sniffing, um ataque passivo","Jamming, um ataque ativo","Spoofing, um ataque passivo","Baiting"]},
    {l:"No 802.1X, o switch da recepção faz o papel de",o:["Autenticador","Suplicante","Servidor de autenticação","Autoridade de registro"]},
    {l:"Laudos de exames, na LGPD, são",o:["Dados pessoais sensíveis","Dados anonimizados","Dados pessoais comuns","Dados públicos"]},
    {l:"Norma com diretrizes para avaliar o impacto à privacidade do novo portal do paciente",o:["ISO/IEC 29134","ISO/IEC 29100","ISO 22313","ISO/IEC 27005"]}],
   why:"Jamming é interferência de rádio; desautenticação é um ataque de protocolo. Sniffing só escuta (passivo); spoofing se passa por outro (ativo). A ISO/IEC 29134 orienta a avaliação de impacto à privacidade, análoga ao RIPD da LGPD."}
 ]
},
{
 id:"eta", title:"O cloro que subiu sozinho", org:"Estação de tratamento de água, 80 mil habitantes", lvl:"Muito difícil",
 tags:["SCADA/ICS","Modbus","IEC 62443","NIST SP 800-82","ICS Advisory Project","CIS Controls","VPN"],
 brief:"Terça, 14:10. Você é a analista de segurança de plantão da companhia de saneamento. O operador liga em pânico: alguém está mudando a dosagem de cloro pela estação de engenharia.",
 ev:[
  {id:"ihm",name:"Alarmes da IHM",at:0,lines:[
   "13:40  operação normal, cloro livre na saída: 1,8 mg/L",
   "14:02  setpoint de dosagem de cloro alterado 2,0 -> 9,5 mg/L  origem: ENG-WS02",
   "14:03  operador reverte setpoint para 2,0 pela IHM",
   "14:09  setpoint alterado 2,0 -> 9,5 mg/L  origem: ENG-WS02",
   "14:10  ALARME ALTO: cloro no tanque de contato 3,6 mg/L e subindo"]},
  {id:"ctx",name:"Contexto operacional",at:0,lines:[
   "A ETA abastece 80 mil pessoas; os reservatórios duram cerca de 6 h",
   "A dosagem pode ser controlada manualmente no painel local da bomba",
   "Limite operacional adotado na saída: 4 mg/L",
   "Analisador de cloro com alarme, sem intertravamento automático da dosagem"]},
  {id:"fw",name:"Firewall e VPN",at:1,lines:[
   "13:55  VPN  usuário=integrador_bombas  origem 91.203.4.77  MFA: não  (conta usada por 6 técnicos)",
   "13:58  ENG-WS02 <- RDP de 172.16.9.20 (pool da VPN)",
   "14:02  ENG-WS02 -> PLC-CL01  Modbus/TCP 502  Write Single Register 40017 = 950",
   "14:09  ENG-WS02 -> PLC-CL01  Modbus/TCP 502  Write Single Register 40017 = 950",
   "regra 12: VPN-FORNECEDORES -> REDE-OT  any/any  permanente"]},
  {id:"inv",name:"Inventário OT",at:3,lines:[
   "PLC-CL01  fabricante Kvaro, firmware 2.1 (alerta público para versões < 3.0: escrita sem autenticação)",
   "ENG-WS02  Windows 7 sem suporte, também usada para ler e-mail",
   "Escritório, IHM e CLPs na mesma VLAN 10",
   "Nenhum monitoramento de tráfego industrial"]}
 ],
 steps:[
  {type:"decide",time:"14:10",text:"O cloro continua subindo. Você ainda não tem os logs de rede, só os alarmes e o contexto.",q:"Primeira ação?",
   opts:[
    {t:"Mandar derrubar todos os acessos remotos à rede OT e pedir que o operador passe a dosagem para controle manual no painel local, mantendo a ETA operando",fx:{op:-5,ct:25,cf:5},out:"Às 14:14 o setpoint para de mudar. O cloro volta a 2 mg/L em 40 minutos e ninguém fica sem água."},
    {t:"Parar a ETA inteira imediatamente",fx:{op:-30,ct:10},out:"A água para de ser tratada e distribuída. Em 6 h, bairros e hospitais ficam sem abastecimento. E o invasor segue conectado."},
    {t:"Atualizar agora o firmware do CLP para a versão 3.0",fx:{op:-25,ct:-10},out:"Atualização sem teste no meio do incidente: o CLP reinicia e a dosagem para por 50 minutos, com o acesso remoto ainda aberto."},
    {t:"Esperar os logs para ter certeza antes de agir",fx:{op:-10,ct:-25,cf:-5},out:"Às 14:25 o cloro na saída passa de 5 mg/L. A distribuição precisa ser interrompida."}],
   why:"Em OT, segurança física e disponibilidade vêm primeiro. Cortar o caminho remoto e passar para controle manual local preserva o processo sem desligá-lo. Parar a planta é último recurso. Patch em CLP exige teste e janela planejada (NIST SP 800-82)."},
  {type:"point",time:"14:30",text:"Chegaram os logs do firewall e da VPN.",q:"Aponte a linha que mostra o comando que efetivamente mudou o processo físico.",ans:["fw:2","fw:3"],hint:"Não é o login, nem o RDP: é a conversa com o controlador.",why:"Um Write Single Register via Modbus/TCP (porta 502) grava o setpoint direto no CLP. O Modbus não autentica quem escreve: quem alcança a rede, comanda o processo."},
  {type:"point",time:"14:40",text:"",q:"Aponte a linha de configuração que permitiu ao fornecedor chegar até o CLP.",ans:["fw:4"],hint:"Não é um evento, é uma regra.",why:"Uma regra any/any permanente liga a VPN de fornecedores diretamente à rede OT. Não há conduto controlado, jump server nem liberação sob demanda."},
  {type:"point",time:"16:00",text:"Chegou o inventário da planta.",q:"Aponte a linha que explica por que o CLP aceitaria a escrita vinda de qualquer máquina que o alcance.",ans:["inv:0"],hint:"A fragilidade está no próprio controlador.",why:"O firmware 2.1 tem vulnerabilidade publicada: escrita sem autenticação. Alertas como esse saem nos ICS advisories da CISA, e o ICS Advisory Project organiza esses dados por fornecedor, produto e setor, o que ajuda a priorizar."},
  {type:"decide",time:"qua 09:00",text:"Reunião com a diretoria para a arquitetura definitiva.",q:"Qual proposta você defende?",
   opts:[
    {t:"Segmentar em zonas (corporativa, DMZ industrial, supervisão, controle) com condutos definidos pela IEC 62443; acesso remoto só por jump server na DMZ com MFA, contas individuais, gravação de sessão e liberação sob demanda; monitoramento passivo do tráfego industrial",fx:{op:10,ct:25,cf:15},out:"O fornecedor mantém o suporte remoto, agora rastreável. Qualquer escrita Modbus fora do padrão gera alerta."},
    {t:"Air gap total: nenhuma conexão da OT com nada e acesso remoto proibido",fx:{op:-15,ct:5},out:"No papel é perfeito. Na prática, os técnicos passam a usar pendrive e modem 4G escondido para manutenção."},
    {t:"Instalar antivírus nos CLPs",fx:{ct:-10},out:"CLPs não rodam antivírus comum. Orçamento desperdiçado."},
    {t:"Trocar a senha da conta compartilhada do integrador e mantê-la",fx:{ct:-10},out:"Seis técnicos com a mesma senha nova. Sem MFA, sem rastreabilidade individual."}],
   why:"A ISA/IEC 62443 organiza a planta em zonas (ativos com requisitos comuns) e condutos (canais controlados entre elas), com níveis de segurança (SL) alvo. Acesso remoto passa a ser um conduto controlado, com MFA e contas nominais."},
  {type:"report",time:"qui 17:00",text:"Relatório para a agência reguladora e para o conselho.",
   fields:[
    {l:"Parte da IEC 62443 que trata da avaliação de risco para definir zonas e condutos",o:["62443-3-2","62443-4-1","62443-4-2","62443-2-1"]},
    {l:"Parte da IEC 62443 a exigir do fabricante Kvaro sobre o processo de desenvolvimento seguro",o:["62443-4-1","62443-3-2","62443-2-1","62443-3-3"]},
    {l:"Por que o CLP aceitou o comando",o:["Modbus legado não autentica quem escreve","O CLP estava sem antivírus","O certificado TLS do Modbus expirou","O RADIUS aprovou o comando"]},
    {l:"Guia do NIST específico para segurança de OT",o:["SP 800-82 Rev. 3","SP 800-53","SP 800-61","CSF 2.0, função Govern"]},
    {l:"Fonte para acompanhar tendências de alertas de ICS por fornecedor e setor",o:["ICS Advisory Project","Comitê Gestor da ICP-Brasil","ANPD","Registro.br"]},
    {l:"CIS Control (v8) que contém a salvaguarda de MFA para acesso remoto",o:["6 – Gestão de controle de acesso","1 – Inventário de ativos corporativos","14 – Conscientização","18 – Testes de invasão"]},
    {l:"Em OT, vem primeiro",o:["Disponibilidade e segurança física","Confidencialidade","Não repúdio","Anonimização"]}],
   why:"62443-3-2: avaliação de risco e definição de zonas e condutos; 3-3: requisitos do sistema por SL; 4-1: desenvolvimento seguro do fornecedor; 4-2: requisitos técnicos dos componentes; 2-1: programa do dono do ativo. O NIST SP 800-82 Rev. 3 (2023) é o guia de OT."}
 ]
},
{
 id:"contrato", title:"O contrato de R$ 2 milhões", org:"Disputa entre duas empresas", lvl:"Muito difícil",
 tags:["Assinatura digital","Hash","Certificado A1/A3","LCR","Carimbo do tempo","ICP-Brasil","Envelope digital"],
 brief:"Você é perita assistente da empresa B. A empresa A cobra R$ 2 milhões com base em um contrato assinado digitalmente pelo ex-diretor Marcos. A empresa B jura que ninguém autorizou esse contrato.",
 ev:[
  {id:"cert",name:"Certificado",at:0,lines:[
   "Titular: MARCOS ALVES LIMA",
   "Emissor: AC Norte Digital (AC de 2º nível)",
   "Cadeia: AC Raiz Brasileira v5 -> AC Norte (1º nível) -> AC Norte Digital",
   "Tipo: A1    Validade: 15/06/2025 a 15/06/2026",
   "Uso da chave: assinatura digital, não repúdio",
   "Número de série: 5F:2A:91:0C"]},
  {id:"val",name:"Relatório do validador",at:0,lines:[
   "Assinatura: criptograficamente válida para o conteúdo assinado",
   "SHA-256 do conteúdo assinado:   3ab1c9e0...71fd",
   "SHA-256 do PDF apresentado:     3ab1c9e0...71fd  (confere)",
   "Data/hora da assinatura: 28/02/2026 18:10 (relógio do computador do signatário)",
   "Carimbo do tempo: ausente",
   "Status do certificado (LCR consultada hoje): REVOGADO em 02/03/2026"]},
  {id:"mails",name:"E-mails internos da empresa B",at:2,lines:[
   "01/03  RH: Marcos Lima desligado da diretoria hoje.",
   "02/03  TI: pedimos a revogação do certificado do Marcos.",
   "04/03  TI: lembrete, os .pfx da diretoria ficam em \\\\fs01\\certificados, senha no senhas.txt da mesma pasta",
   "10/03  Comercial (Paulo): contrato com a empresa A resolvido e enviado assinado."]}
 ],
 steps:[
  {type:"point",time:"seg 09:00",text:"Um bom perito começa pelo que é desfavorável ao próprio cliente.",q:"Aponte a linha que mostra que o documento não foi alterado depois de assinado.",ans:["val:2"],hint:"Integridade se prova comparando resumos.",why:"O hash do PDF apresentado é idêntico ao hash do conteúdo assinado: integridade confirmada. Alegar adulteração seria derrubado pelo perito da outra parte."},
  {type:"point",time:"seg 10:30",text:"",q:"Aponte a linha que torna a data da assinatura frágil como prova.",ans:["val:3","val:4"],hint:"De onde vem essa data?",why:"A data vem do relógio do computador de quem assinou, que qualquer pessoa altera, e não há carimbo do tempo de uma ACT. Sem carimbo, não há prova confiável de quando a assinatura foi feita."},
  {type:"point",time:"seg 15:00",text:"A empresa B entrega e-mails internos.",q:"Aponte a linha que explica como outra pessoa poderia ter assinado como Marcos.",ans:["mails:2"],hint:"A1 guarda a chave privada em arquivo.",why:"Certificado A1 é um arquivo (.pfx). Guardado numa pasta compartilhada com a senha ao lado, a chave privada deixa de ser exclusiva do titular, e o não repúdio perde a base prática. Junte com o e-mail de 10/03 e com a revogação em 02/03: a hipótese de assinatura retroativa, com relógio ajustado para antes da revogação, fica forte."},
  {type:"decide",time:"ter 09:00",text:"Você precisa entregar o parecer.",q:"Qual conclusão?",
   opts:[
    {t:"O conteúdo está íntegro, mas autoria e data não são confiáveis: A1 acessível a terceiros, data vinda do relógio local, sem carimbo do tempo, e certificado revogado em 02/03. Recomendo perícia na máquina de onde partiu a assinatura e nos logs de acesso ao compartilhamento",fx:{ct:15,cf:20},out:"O juiz determina perícia no computador do Paulo. O log mostra o relógio sendo alterado para 28/02 no dia 10/03."},
    {t:"A assinatura é válida: certificado ICP-Brasil, conteúdo íntegro e dentro do prazo de validade em 28/02",fx:{cf:-20},out:"Você acaba de produzir a melhor prova da empresa A."},
    {t:"A assinatura é nula porque certificados A1 não têm validade jurídica",fx:{cf:-25},out:"O juiz descarta: A1 é certificado ICP-Brasil plenamente válido."},
    {t:"O documento foi adulterado depois de assinado",fx:{cf:-30},out:"O validador mostra o contrário e sua credibilidade como perita cai."}],
   why:"Assinatura digital prova integridade e vincula a chave privada ao titular. Se a chave privada não está sob controle exclusivo dele, a autoria fica em dúvida. A data só é forte com carimbo do tempo de ACT credenciada; e a revogação só pesa se for possível provar que a assinatura foi feita depois dela."},
  {type:"decide",time:"qua 10:00",text:"A empresa B pede uma política nova para que isso não se repita.",q:"O que você recomenda?",
   opts:[
    {t:"Certificados A3 em token para pessoas (ou HSM para assinaturas automáticas), carimbo do tempo de ACT credenciada em toda assinatura, revogação imediata no desligamento e validação de LCR/OCSP nos documentos recebidos",fx:{ct:25,cf:15},out:"A chave privada não sai mais do hardware, e cada assinatura passa a ter data comprovável."},
    {t:"Manter o A1 na pasta, trocando a senha todo mês",fx:{ct:-15},out:"A senha continua no mesmo lugar do arquivo."},
    {t:"Abolir a assinatura digital e voltar ao papel",fx:{op:-20},out:"Processos travam e o papel não é mais seguro."},
    {t:"Usar só o hash SHA-256 dos contratos, sem assinatura",fx:{ct:-20},out:"Hash sem chave não prova autoria: qualquer pessoa recalcula."}],
   why:"No A3, a chave privada é gerada e fica em hardware criptográfico (token ou cartão), sem cópia. Carimbo do tempo resolve a data. Revogação no desligamento e checagem de LCR/OCSP fecham o ciclo de vida."},
  {type:"report",time:"qui 16:00",text:"Anexo técnico do laudo.",
   fields:[
    {l:"Quem credencia, audita e fiscaliza a AC Norte Digital",o:["ITI, como AC Raiz","ANPD","Anatel","CGI.br"]},
    {l:"Entidade que conferiu os documentos do Marcos na emissão",o:["Autoridade de Registro (AR)","Autoridade de Carimbo do Tempo (ACT)","AC Raiz","Cartório de notas"]},
    {l:"A AC Raiz poderia emitir o certificado direto para o Marcos?",o:["Não, ela só certifica ACs do nível seguinte","Sim, mediante pagamento","Sim, apenas do tipo A3","Só para servidores públicos"]},
    {l:"Chave usada para verificar a assinatura do Marcos",o:["Chave pública do Marcos","Chave privada do Marcos","Chave pública da empresa A","Chave de sessão simétrica"]},
    {l:"O hash conferido garante",o:["Integridade","Confidencialidade","Disponibilidade","Autenticação multifator"]},
    {l:"Para enviar o próximo contrato sigiloso à empresa A sem combinar senha antes",o:["Envelope digital","Carimbo do tempo","Assinatura com a chave privada","Hash SHA-256"]},
    {l:"Referência de hora de uma ACT credenciada na ICP-Brasil",o:["Hora legal brasileira (Observatório Nacional)","Relógio do signatário","Qualquer servidor NTP público","Servidor da empresa A"]}],
   why:"MP 2.200-2/2001: Comitê Gestor define políticas; ITI é a AC Raiz, credencia e fiscaliza. A AR identifica o solicitante; a AC emite. Envelope digital: conteúdo com chave simétrica, e essa chave cifrada com a chave pública do destinatário."}
 ]
},
{
 id:"netsul", title:"Black Friday na NetSul", org:"Operadora de internet, 1,2 milhão de clientes", lvl:"Difícil",
 tags:["UDP","Amplificação","ICMP","IDS/IPS","Marco Civil","Anatel 740","CSF 2.0"],
 brief:"Sexta, 19:05. Você coordena o NOC da NetSul. O tráfego do backbone sextuplicou, clientes residenciais reclamam de lentidão e a loja virtual de um grande cliente está fora do ar.",
 ev:[
  {id:"noc",name:"Painel do NOC",at:0,lines:[
   "18:50  entrada no backbone: 6,2 Gbps (normal)",
   "19:02  entrada no backbone: 38,4 Gbps",
   "19:02  destino dominante: 200.180.33.10 (cliente LojaMax)",
   "19:02  protocolo dominante: UDP, portas de origem 53 e 123",
   "19:03  links de trânsito a 97%; clientes residenciais com perda de pacotes"]},
  {id:"ids",name:"Alertas do IDS",at:0,lines:[
   "19:02  resposta DNS de 3.120 bytes para consulta ANY de 64 bytes",
   "19:02  NTP 'monlist' com resposta 206 vezes maior que a requisição",
   "19:03  consultas DNS com origem forjada 200.180.33.10 saindo de 1.214 roteadores de clientes NetSul",
   "19:04  ICMP echo request: 2.000 pacotes/s de hosts variados",
   "sensor em porta espelhada (SPAN), capacidade 10 Gbps"]},
  {id:"mkt",name:"E-mail do marketing",at:3,lines:[
   "De: Diretoria de Marketing",
   "Aproveita a Black Friday: reduz a velocidade do app StreamX para quem não assina o NetSul Play.",
   "Nosso vídeo precisa de prioridade hoje."]},
  {id:"oficio",name:"Ofício",at:4,lines:[
   "Delegacia de Crimes Cibernéticos, Ofício 118/2026, recebido por e-mail",
   "Solicitamos registros de conexão e o CONTEÚDO das mensagens do IP 200.99.1.44",
   "Período: janeiro de 2025",
   "Anexos: nenhum (sem decisão judicial)"]}
 ],
 steps:[
  {type:"point",time:"19:06",text:"",q:"Aponte a evidência que caracteriza um ataque de amplificação.",ans:["ids:0","ids:1"],hint:"Compare o tamanho da pergunta com o da resposta.",why:"Consultas pequenas geram respostas dezenas ou centenas de vezes maiores, entregues à vítima cujo IP foi forjado como origem. Por isso as portas de origem são 53 (DNS) e 123 (NTP)."},
  {type:"point",time:"19:07",text:"",q:"Aponte a linha que mostra a própria rede da NetSul sendo usada no ataque.",ans:["ids:2"],hint:"Olhe o que sai, não só o que entra.",why:"Roteadores de clientes com resolvedor DNS aberto, e uma rede que deixa sair pacotes com origem forjada (sem BCP 38), transformam a NetSul em amplificadora do ataque."},
  {type:"decide",time:"19:08",text:"Clientes residenciais estão caindo. A LojaMax liga a cada 2 minutos.",q:"Qual mitigação?",
   opts:[
    {t:"Acionar a mitigação de DDoS no trânsito (desvio para limpeza) filtrando UDP de origem 53/123 para o IP da LojaMax, aplicar anti-spoofing na saída dos clientes e bloquear resolução recursiva aberta nos roteadores dos clientes",fx:{op:20,ct:25},out:"Em 25 minutos o backbone volta a 7 Gbps e a LojaMax volta ao ar."},
    {t:"Colocar o IP da LojaMax em blackhole total até segunda",fx:{op:-10,ct:10,cf:-10},out:"O backbone respira, mas a LojaMax some da internet na Black Friday. O atacante conseguiu exatamente o que queria."},
    {t:"Trocar agora o IDS por um IPS em linha na borda",fx:{op:-25,ct:-5},out:"O equipamento, de 10 Gbps, vira gargalo num link de 40 Gbps e derruba todos os clientes."},
    {t:"Bloquear todo ICMP na rede",fx:{op:-5,ct:-5},out:"O ICMP era ruído; o volume real é UDP. E alguns clientes passam a ter falhas de MTU."}],
   why:"Mitigação seletiva preserva o serviço da vítima. Anti-spoofing (BCP 38) e fechar resolvedores abertos tiram a NetSul da lista de amplificadores. Um IPS em linha precisa suportar a vazão, senão vira ponto de falha."},
  {type:"decide",time:"20:30",text:"Com o ataque sob controle, chega um e-mail do marketing.",q:"Sua resposta?",
   opts:[
    {t:"Recusar por escrito: discriminar tráfego por aplicação para favorecer serviço próprio viola a neutralidade de rede",fx:{cf:20},out:"A diretoria jurídica apoia e arquiva o pedido."},
    {t:"Aplicar só durante a Black Friday",fx:{cf:-25},out:"Um usuário mede a diferença e publica. Denúncia à Anatel no dia seguinte."},
    {t:"Aplicar, desde que conste em letra miúda no contrato",fx:{cf:-20},out:"Cláusula contratual não afasta a lei."},
    {t:"Aplicar como 'gerência de rede' justificada pelo DDoS",fx:{cf:-15},out:"Gerência técnica precisa ser isonômica; mirar um concorrente específico não é requisito técnico."}],
   why:"Marco Civil da Internet, art. 9º: tratamento isonômico dos pacotes, sem distinção por conteúdo, origem, destino, serviço ou aplicação. Exceções só por requisitos técnicos indispensáveis e serviços de emergência."},
  {type:"decide",time:"seg 09:00",text:"Chega um ofício por e-mail.",q:"Como responder?",
   opts:[
    {t:"Informar que registros e, principalmente, conteúdo de comunicações só são fornecidos mediante ordem judicial; que a guarda obrigatória de registros de conexão é de 1 ano; e verificar se algo de jan/2025 ainda existe, preservando se houver requerimento",fx:{cf:20},out:"A delegacia obtém a ordem judicial e reenvia o pedido, agora dentro da lei."},
    {t:"Enviar tudo o que existir por e-mail",fx:{cf:-30},out:"Entrega sem ordem judicial expõe a NetSul a responsabilização e o dado pode ser anulado como prova."},
    {t:"Apagar os registros para evitar problemas",fx:{cf:-35},out:"Destruir dados diante de um pedido formal agrava tudo."},
    {t:"Ignorar o ofício",fx:{cf:-10},out:"A falta de resposta gera desgaste e novo ofício com prazo."}],
   why:"Marco Civil: provedor de conexão guarda registros de conexão por 1 ano (art. 13); fornecimento depende de ordem judicial; o conteúdo das comunicações privadas tem proteção reforçada. Autoridade pode requerer a guarda por prazo maior, cautelarmente."},
  {type:"decide",time:"seg 11:00",text:"A diretoria regulatória pergunta se há obrigação específica do setor.",q:"O que fazer?",
   opts:[
    {t:"Notificar a Anatel sobre o incidente relevante, como exige a Resolução 740/2020, e tratar a vulnerabilidade dos roteadores de clientes na gestão de riscos",fx:{cf:20},out:"A notificação chega no prazo interno e a Anatel pede o plano de correção dos roteadores."},
    {t:"Notificar apenas a ANPD",fx:{cf:-15},out:"Não houve vazamento de dados pessoais; a obrigação setorial com a Anatel ficou descumprida."},
    {t:"Nada: não houve vazamento",fx:{cf:-20},out:"Incidente com impacto em milhares de clientes é justamente o que a regulação setorial quer saber."},
    {t:"Avisar só os clientes afetados por SMS",fx:{cf:-10},out:"Comunicação aos clientes é boa, mas não substitui a notificação regulatória."}],
   why:"A Resolução Anatel nº 740/2020 (Regulamento de Segurança Cibernética aplicada ao setor de telecomunicações) exige política de segurança cibernética, gestão de riscos e notificação de incidentes relevantes à Anatel."},
  {type:"report",time:"seg 17:00",text:"Relatório pós-incidente.",
   fields:[
    {l:"Por que o atacante usa UDP",o:["Sem handshake, aceita IP de origem forjado","UDP é cifrado","UDP garante entrega","UDP ignora o roteamento IP"]},
    {l:"Classificação do ataque",o:["Ativo, contra a disponibilidade","Passivo, contra a confidencialidade","Ativo, contra a integridade","Passivo, contra a disponibilidade"]},
    {l:"O que o IDS em porta espelhada consegue fazer",o:["Detectar e alertar, sem bloquear","Bloquear em linha","Cifrar o tráfego","Autenticar usuários"]},
    {l:"Tema do Marco Civil violado pelo pedido do marketing",o:["Neutralidade de rede (art. 9º)","Guarda de registros (art. 13)","Responsabilidade por conteúdo de terceiros (art. 19)","Proteção de crianças"]},
    {l:"Guarda obrigatória de registros de acesso quando a NetSul Play atua como provedor de aplicação",o:["6 meses","1 ano","5 anos","30 dias"]},
    {l:"Fechar resolvedores DNS abertos nos roteadores dos clientes é, no CSF 2.0, principalmente",o:["Protect","Detect","Recover","Govern"]}],
   why:"TCP tem handshake de três vias, o que dificulta forjar origem; UDP não. IDS observa uma cópia do tráfego; IPS fica no caminho. Marco Civil: conexão 1 ano, aplicação 6 meses."}
 ]
},
{
 id:"pixel", title:"PixelKids virou notícia", org:"Jogo online infantil, 2 milhões de contas", lvl:"Difícil",
 tags:["ECA Digital","LGPD","ANPD","ISO 29100","ISO 27701","ISO 29134","27001/27002"],
 brief:"Segunda. Você acaba de assumir como encarregada de dados (DPO) da PixelKids. Uma reportagem sobre gastos de crianças no jogo saiu ontem e a caixa de reclamações lotou.",
 ev:[
  {id:"recl",name:"Reclamações",at:0,lines:[
   "Mãe: minha filha de 9 anos gastou R$ 800 no 'Baú Lendário', que sorteia itens",
   "Pai: um adulto desconhecido mandou mensagens para meu filho pelo chat do jogo",
   "Escola: alunos compartilham localização em tempo real pelo mapa do jogo"]},
  {id:"cad",name:"Fluxo de cadastro",at:0,lines:[
   "Passo 1: 'Quantos anos você tem?' [campo livre, sem verificação]",
   "Passo 2: contas de qualquer idade criadas sem vínculo com responsável",
   "Padrão: perfil público, chat aberto a todos, localização ligada",
   "Padrão: publicidade personalizada por perfil de comportamento ativada",
   "Coleta: data de nascimento, escola, agenda de contatos e localização precisa"]},
  {id:"alerta",name:"Alerta de segurança",at:3,lines:[
   "Bucket 'pixelkids-backup' configurado como público desde 12/08",
   "Arquivo export_usuarios.csv: 310 mil registros",
   "Campos: nome, apelido, data de nascimento, escola, cidade, e-mail do responsável",
   "Acessos externos: 3 IPs distintos entre 20/09 e 21/09"]}
 ],
 steps:[
  {type:"point",time:"seg 09:00",text:"Primeiro diagnóstico de conformidade.",q:"Aponte a linha que descumpre a exigência de verificação de idade do ECA Digital.",ans:["cad:0"],hint:"Como o jogo sabe a idade de quem entra?",why:"O ECA Digital (Lei 15.211/2025) exige mecanismos confiáveis de verificação de idade; autodeclaração em campo livre não basta."},
  {type:"point",time:"seg 09:40",text:"",q:"Aponte a linha que mais contraria o princípio da minimização da coleta (ISO/IEC 29100).",ans:["cad:4"],hint:"Um jogo precisa mesmo de tudo isso?",why:"Escola, agenda de contatos e localização precisa não são necessárias para jogar. A ISO/IEC 29100 e a LGPD (princípio da necessidade) pedem coletar só o indispensável para a finalidade."},
  {type:"point",time:"seg 10:15",text:"",q:"Aponte o mecanismo de monetização vedado pelo ECA Digital para esse público.",ans:["recl:0"],hint:"Pagar sem saber o que vai receber.",why:"Caixas de recompensa (loot boxes), em que se paga por itens sorteados, são vedadas em jogos direcionados ou de acesso provável por crianças e adolescentes."},
  {type:"decide",time:"seg 14:00",text:"Chega um alerta da equipe de nuvem.",q:"O que você faz?",
   opts:[
    {t:"Fechar o bucket, preservar os logs de acesso, avaliar o risco e comunicar a ANPD e os responsáveis pelas crianças no prazo",fx:{ct:20,cf:30},out:"A comunicação sai em dois dias úteis, com medidas já adotadas e orientação às famílias."},
    {t:"Fechar o bucket e não comunicar, já que não havia senhas no arquivo",fx:{ct:10,cf:-30},out:"Nome, escola e cidade de crianças são exatamente o que um predador procura. A omissão vira manchete."},
    {t:"Apagar o bucket e os logs para eliminar a evidência",fx:{ct:-10,cf:-40},out:"Sem logs não dá para saber o que foi copiado, e a destruição agrava a sanção."},
    {t:"Comunicar só quando a reformulação do app terminar",fx:{ct:10,cf:-25},out:"Meses depois, fora de qualquer prazo razoável."}],
   why:"Dados de crianças exigem tratamento no seu melhor interesse (LGPD, art. 14) e o incidente tem risco relevante: comunicação à ANPD e aos titulares, aqui representados pelos responsáveis, no prazo regulamentado. Preservar logs permite dimensionar o vazamento."},
  {type:"decide",time:"ter 10:00",text:"O CEO pede um plano de adequação para apresentar à imprensa.",q:"Qual plano?",
   opts:[
    {t:"Verificação de idade confiável; contas de menores de 16 vinculadas a um responsável, com ferramentas de supervisão; perfil privado, chat restrito e localização desligada por padrão; fim da publicidade por perfilamento para menores; remoção dos baús pagos",fx:{op:-5,cf:30},out:"A receita cai no curto prazo, mas a ANPD registra a adequação voluntária e a reputação se recupera."},
    {t:"Mudar os termos de uso para dizer que o jogo é proibido para menores de 18",fx:{cf:-25},out:"O público é visivelmente infantil. A lei vale para serviços de acesso provável por crianças, digam os termos o que disserem."},
    {t:"Só remover o Baú Lendário",fx:{cf:-10},out:"O problema mais noticiado some, mas chat aberto e localização continuam."},
    {t:"Escrever um aviso de privacidade mais claro e manter os padrões",fx:{cf:-15},out:"Transparência não substitui proteção por padrão."}],
   why:"O ECA Digital adota proteção por padrão e desde a concepção: configurações mais protetivas como ponto de partida, supervisão parental, verificação de idade, restrição de perfilamento para publicidade e vedação de loot boxes. A ANPD fiscaliza."},
  {type:"decide",time:"qua 15:00",text:"O conselho quer um sistema de gestão que evite repetir isso.",q:"Qual caminho?",
   opts:[
    {t:"Estender o SGSI da ISO/IEC 27001 com a ISO/IEC 27701 para a gestão da privacidade e fazer PIA (ISO/IEC 29134) antes de cada funcionalidade nova",fx:{ct:15,cf:20},out:"A próxima funcionalidade, um chat por voz, é redesenhada antes de ir ao ar por causa da PIA."},
    {t:"Contratar só um pentest anual",fx:{ct:-5,cf:-10},out:"Pentest acha falhas técnicas, mas não governa privacidade."},
    {t:"Buscar a certificação ISO 22301",fx:{cf:-10},out:"Continuidade de negócios é importante, mas não trata privacidade."},
    {t:"Certificar a empresa na ISO/IEC 29100",fx:{cf:-10},out:"A 29100 é um framework de princípios, não uma norma certificável."}],
   why:"A ISO/IEC 27701 trata da gestão da informação de privacidade para controladores e operadores (a versão 2019 é extensão da 27001/27002; a de 2025 passou a ser independente). A 29134 orienta a avaliação de impacto à privacidade."},
  {type:"report",time:"sex 12:00",text:"Relatório ao conselho.",
   fields:[
    {l:"Autoridade que fiscaliza o ECA Digital",o:["ANPD","Anatel","ITI","Conselho Tutelar"]},
    {l:"Na LGPD, o tratamento de dados de crianças deve",o:["Atender ao melhor interesse e, em regra, ter consentimento específico de um dos pais ou responsável","Basear-se no legítimo interesse da empresa","Aceitar a autodeclaração da criança","Seguir as mesmas regras de dados comuns"]},
    {l:"Controle novo da ISO/IEC 27002:2022 mais ligado ao bucket configurado como público",o:["Gestão de configuração","Filtragem web","Codificação segura","Inteligência de ameaças"]},
    {l:"Controle novo que ajudaria a detectar o CSV saindo da empresa",o:["Prevenção de vazamento de dados","Mascaramento de dados","Monitoramento de segurança física","Prontidão de TIC para continuidade"]},
    {l:"Cláusula da ISO/IEC 27001 em que se define o escopo do SGSI",o:["4 – Contexto da organização","7 – Apoio","9 – Avaliação de desempenho","Anexo A"]},
    {l:"Número de controles do Anexo A da ISO/IEC 27001:2022",o:["93, em 4 temas","114, em 14 domínios","18 controles com IGs","200, em 11 cláusulas"]}],
   why:"A 27002:2022 trouxe 11 controles novos, entre eles gestão de configuração, prevenção de vazamento de dados, mascaramento de dados, filtragem web e codificação segura. A 27001:2022 tem 93 controles em 4 temas: organizacionais, pessoas, físicos e tecnológicos."}
 ]
},
{
 id:"api", grp:"e7", title:"A API da Prefeitura Digital", org:"Órgão público, sistema de agendamento", lvl:"Muito difícil",
 tags:["Segurança de software","OWASP","SQL injection","IDOR/BOLA","Superfície de ataque","CVSS","SAST/DAST/SCA"],
 brief:"Quarta, 10:45. Um jornalista avisa a ouvidoria que recebeu uma planilha com dados de milhares de cidadãos, 'tirada do sistema de agendamento'. Você é o analista de segurança do órgão.",
 ev:[
  {id:"waf",name:"Log do WAF",at:0,lines:[
   "10:02  GET /api/v1/cidadaos?cpf=12345678900                          200   45 ms",
   "10:14  GET /api/v1/cidadaos?cpf=1' OR '1'='1                         200   2.310 ms   resposta 18 MB",
   "10:15  GET /api/v1/cidadaos?cpf=1' UNION SELECT usuario,senha FROM admins--   200",
   "10:21  GET /api/v1/cidadaos/10233   token do usuário 88   200",
   "10:21–10:40  GET /api/v1/cidadaos/10234 … /19870   9.636 requisições, mesmo token   200",
   "WAF em modo 'somente registro' desde a implantação"]},
  {id:"cod",name:"Trecho do código",at:1,lines:[
   "String sql = \"SELECT * FROM cidadaos WHERE cpf = '\" + req.getParameter(\"cpf\") + \"'\";",
   "ResultSet rs = stmt.executeQuery(sql);",
   "@GetMapping(\"/cidadaos/{id}\")  // devolve o cadastro sem checar se o id pertence ao usuário logado",
   "// senhas de administradores gravadas com MD5, sem salt"]},
  {id:"sup",name:"Inventário de exposição",at:4,lines:[
   "api.agenda.prefeitura (produção): exposta à internet",
   "api-hml.agenda.prefeitura (homologação): exposta à internet, com cópia dos dados reais de produção",
   "Swagger UI habilitado em produção, listando todos os endpoints",
   "Biblioteca de log com CVE crítica (CVSS 10.0), exploração ativa conhecida, versão desatualizada",
   "Análise estática de código: nunca executada. Último pentest: 2022"]}
 ],
 steps:[
  {type:"point",time:"10:50",text:"Você abre o log do WAF.",q:"Aponte a linha que mostra uma injeção de SQL que funcionou.",ans:["waf:1","waf:2"],hint:"Procure aspas no parâmetro e uma resposta anormal.",why:"A condição ' OR '1'='1 é sempre verdadeira: a consulta devolve a tabela inteira (18 MB). O UNION em seguida tenta ler outra tabela. O WAF viu tudo, mas estava só registrando."},
  {type:"point",time:"11:05",text:"O desenvolvedor manda o trecho do código.",q:"Aponte a linha que causa a injeção.",ans:["cod:0"],hint:"Onde a entrada do usuário vira parte do comando?",why:"O parâmetro é concatenado direto na string SQL. A correção definitiva é consulta parametrizada (prepared statement), em que a entrada é tratada como dado, nunca como comando."},
  {type:"point",time:"11:15",text:"Mesmo depois das 10:15, os dados continuaram saindo.",q:"Aponte uma evidência do segundo problema, que não é injeção.",ans:["waf:3","waf:4","cod:2"],hint:"Um usuário legítimo acessando cadastros que não são dele.",why:"Com um token válido, o usuário 88 percorreu os ids de 10.233 a 19.870. O servidor não confere se o objeto pertence a quem pede: é quebra de autorização em nível de objeto (BOLA/IDOR), o risco número 1 do OWASP API Security Top 10."},
  {type:"decide",time:"11:20",text:"Os dados seguem vazando enquanto você discute com a equipe.",q:"Qual contenção?",
   opts:[
    {t:"WAF em modo bloqueio com regra específica para o padrão de injeção (patch virtual), limite de requisições por token, revogar o token 88, hotfix com consultas parametrizadas e verificação de dono do objeto, e troca das senhas de administrador",fx:{op:-5,ct:25,cf:10},out:"O vazamento para às 11:40. O hotfix vai para produção às 18h, após teste rápido."},
    {t:"Tirar o sistema do ar por 30 dias até reescrever tudo",fx:{op:-30,ct:15,cf:-5},out:"Cidadãos ficam sem agendamento de saúde por um mês; a imprensa foca no apagão."},
    {t:"Bloquear o IP do atacante",fx:{ct:-15},out:"Às 11:52 ele volta por outro IP, com outro token."},
    {t:"Trocar a URL da API para /api/v2-x9 para despistar",fx:{ct:-20},out:"Segurança por obscuridade: o Swagger publicado entrega o endereço novo em minutos."}],
   why:"Patch virtual no WAF é controle compensatório enquanto a correção definitiva (código) não sai. Revogar credenciais usadas no ataque e limitar taxa cortam a enumeração. Mudar a URL é obscuridade, não controle."},
  {type:"point",time:"qui 09:00",text:"Você mapeia tudo o que está exposto.",q:"Aponte a linha que mais aumenta a superfície de ataque sem necessidade para o negócio.",ans:["sup:1","sup:2"],hint:"O que está exposto e nem deveria existir em produção?",why:"Homologação com dados reais exposta à internet dobra a superfície de ataque, geralmente com controles mais fracos. Swagger em produção entrega o mapa da API. Superfície de ataque é tudo que um atacante pode alcançar: reduzir é o primeiro controle."},
  {type:"decide",time:"qui 10:00",text:"Há muitas vulnerabilidades e pouca gente.",q:"Como priorizar?",
   opts:[
    {t:"Primeiro a biblioteca com CVSS 10, exploração ativa e exposta à internet; depois tirar a homologação da internet e mascarar seus dados; depois o Swagger e o armazenamento de senhas",fx:{ct:20,cf:5},out:"Na sexta, um scanner em massa tenta explorar aquela biblioteca e falha."},
    {t:"Corrigir primeiro o que for mais fácil, para mostrar resultado",fx:{ct:-10},out:"A lista diminui rápido, mas o item crítico fica aberto mais uma semana."},
    {t:"Esperar o próximo pentest para decidir",fx:{ct:-20},out:"O pentest está marcado para março."},
    {t:"Priorizar só pelo número do CVSS, sem olhar exposição",fx:{ct:5},out:"Funciona às vezes, mas uma falha CVSS 9 num servidor isolado passa na frente de uma CVSS 8 na internet."}],
   why:"CVSS mede a severidade técnica, não o risco no seu ambiente. Priorize combinando severidade, exposição (internet ou não), exploração ativa conhecida e valor do ativo."},
  {type:"decide",time:"sex 15:00",text:"A direção pergunta como não repetir isso.",q:"O que você propõe?",
   opts:[
    {t:"Ciclo de desenvolvimento seguro: requisitos de segurança, modelagem de ameaças, revisão de código, SAST, DAST e SCA no pipeline, gestão de dependências e pentest periódico",fx:{ct:20,cf:10},out:"Três meses depois, o pipeline barra um commit com concatenação de SQL."},
    {t:"Só um pentest anual",fx:{ct:-5},out:"Encontra falhas uma vez por ano, depois que já estão em produção."},
    {t:"Só treinamento dos desenvolvedores",fx:{ct:0},out:"Ajuda, mas sem verificação automática os erros voltam."},
    {t:"O WAF agora bloqueia, então está resolvido",fx:{ct:-15},out:"O WAF não pega o IDOR: as requisições são perfeitamente normais."}],
   why:"Segurança de software se constrói em todas as fases. SAST analisa o código sem executar; DAST testa a aplicação rodando; SCA encontra componentes de terceiros vulneráveis. WAF não enxerga falhas de lógica de autorização."},
  {type:"report",time:"sex 18:00",text:"Relatório técnico para o comitê de segurança.",
   fields:[
    {l:"Categoria da falha que permitiu ler cadastros de outros cidadãos trocando o id",o:["Quebra de autorização em nível de objeto (BOLA/IDOR)","Injeção","Falha criptográfica","SSRF"]},
    {l:"Correção definitiva da injeção",o:["Consultas parametrizadas e validação de entrada","WAF em modo bloqueio","Esconder as mensagens de erro","Criptografar o banco de dados"]},
    {l:"Ferramenta que analisa o código-fonte sem executá-lo",o:["SAST","DAST","SCA","WAF"]},
    {l:"Ferramenta que teria apontado a biblioteca vulnerável",o:["SCA (análise de composição de software)","SAST","DAST","IDS"]},
    {l:"Forma correta de guardar senhas",o:["Hash lento com salt (bcrypt, scrypt ou Argon2)","MD5 com salt","SHA-256 sem salt","AES com a chave no código"]},
    {l:"O CVSS mede",o:["A severidade técnica da vulnerabilidade","A probabilidade de ataque na sua empresa","O prejuízo financeiro","O prazo de correção"]},
    {l:"Regra no WAF enquanto o código não é corrigido é",o:["Patch virtual (controle compensatório)","Aceitação do risco","Correção definitiva","Hardening do sistema operacional"]}],
   why:"MD5 e SHA-256 são rápidos demais para senhas; hashes lentos e com salt dificultam quebra em massa. Como o incidente envolve dados pessoais, também cabe a comunicação à ANPD e aos titulares."}
 ]
},
{
 id:"forense", grp:"e7", title:"O notebook do tesoureiro", org:"Empresa de logística, investigação interna", lvl:"Muito difícil",
 tags:["Forense digital","Ordem de volatilidade","Cadeia de custódia","Hash","Write blocker","Segregação de funções"],
 brief:"Sexta, 09:10. A auditoria encontrou 14 transferências para uma conta desconhecida, todas aprovadas pelo usuário da tesouraria. Você lidera a resposta forense.",
 ev:[
  {id:"sit",name:"Situação",at:0,lines:[
   "09:10  auditoria encontra 14 transferências para uma conta desconhecida",
   "O notebook do tesoureiro está ligado, com a tela bloqueada, na mesa dele",
   "O tesoureiro foi afastado às 09:30 e saiu levando o celular",
   "O disco do notebook é cifrado (BitLocker)",
   "Os logs do ERP são sobrescritos a cada 7 dias"]},
  {id:"cust",name:"Formulário de custódia",at:2,lines:[
   "Item 1: notebook, série 7H2K9Q1, coletado por J. Souza em 12/09 10:05, lacre 004211",
   "Imagem do disco: SHA-256 a91f…c3e0, calculado na coleta, com bloqueador de escrita",
   "12/09 14:00  item entregue a T. Reis (TI) 'para dar uma olhada', sem assinatura nem registro de devolução",
   "13/09 09:00  SHA-256 da imagem recalculado: a91f…c3e0",
   "13/09 11:00  notebook original ligado pela TI para copiar planilhas; data de acesso alterada em 3.200 arquivos"]},
  {id:"tl",name:"Linha do tempo",at:4,lines:[
   "11/09 22:41  VPN: login de tesouraria01 a partir do IP residencial cadastrado do tesoureiro",
   "11/09 22:47  ERP: transferência 1 de 14 criada por tesouraria01",
   "11/09 22:48  ERP: aprovação de segundo nível feita pelo mesmo usuário (perfil acumulado)",
   "11/09 23:05  navegador do notebook: webmail pessoal aberto com o assunto 'dados da conta nova'"]}
 ],
 steps:[
  {type:"decide",time:"09:35",text:"O notebook está ligado, bloqueado, com disco cifrado.",q:"O que fazer com ele?",
   opts:[
    {t:"Não desligar: fotografar a cena, isolar da rede, acionar a equipe forense para coletar memória RAM e dados voláteis (incluindo material da chave de cifragem) e só depois fazer a imagem do disco",fx:{ct:20,cf:15},out:"A RAM traz a chave do BitLocker, sessões abertas e o histórico do navegador em memória."},
    {t:"Desligar imediatamente para preservar",fx:{ct:-20,cf:-5},out:"Ao desligar, a RAM some e o disco volta a ficar cifrado. Sem a senha do tesoureiro, o conteúdo fica inacessível."},
    {t:"Pedir à TI para desbloquear e copiar as planilhas",fx:{ct:-10,cf:-20},out:"Cada clique altera metadados do original. A defesa do tesoureiro vai adorar."},
    {t:"Levar o notebook para casa e analisar com calma no fim de semana",fx:{cf:-30},out:"Sem registro de posse, qualquer prova extraída fica contestável."}],
   why:"Ordem de volatilidade (RFC 3227): coletar primeiro o que se perde mais rápido (memória, conexões, processos), depois disco. Com cifragem de disco, desligar pode tornar tudo inacessível. Nunca trabalhe no original."},
  {type:"decide",time:"10:00",text:"Os logs do ERP são sobrescritos a cada 7 dias.",q:"E os registros dos servidores?",
   opts:[
    {t:"Preservar já os logs de ERP, VPN, e-mail e proxy, exportados com hash e registro de quem coletou, e suspender a rotação desses logs",fx:{ct:15,cf:15},out:"Os registros de 11/09 ficam preservados antes da sobrescrita."},
    {t:"Esperar o laudo do notebook para decidir",fx:{ct:-15,cf:-10},out:"Na quinta seguinte, o log do ERP de 11/09 foi sobrescrito."},
    {t:"Tirar prints das telas do ERP",fx:{cf:-10},out:"Print é frágil como prova: sem integridade verificável, sem metadados."},
    {t:"Pedir ao fornecedor do ERP que mande os logs quando puder",fx:{ct:-5},out:"Chegam em três semanas, incompletos."}],
   why:"Evidência em servidor também é volátil quando há rotação. Preservação imediata, com hash e registro, é parte da coleta."},
  {type:"point",time:"seg 09:00",text:"O advogado da empresa pede o formulário de custódia.",q:"Aponte a linha que quebra a cadeia de custódia.",ans:["cust:2"],hint:"Procure uma mudança de posse sem registro.",why:"Toda transferência de posse precisa de registro: quem, quando, por quê, com assinatura. Uma lacuna permite alegar manipulação. No processo penal, a cadeia de custódia está regulada nos arts. 158-A a 158-F do CPP."},
  {type:"point",time:"seg 09:20",text:"",q:"Aponte a linha que compromete o original, mesmo com a imagem íntegra.",ans:["cust:4"],hint:"Alguém mexeu no equipamento em vez da cópia.",why:"Ligar e navegar no original altera metadados (datas de acesso) em milhares de arquivos. A imagem, com hash igual antes e depois, continua íntegra e é ela que deve ser analisada."},
  {type:"point",time:"seg 11:00",text:"A linha do tempo está pronta.",q:"Aponte a linha que mostra a falha de controle que permitiu a fraude.",ans:["tl:2"],hint:"Uma pessoa sozinha conseguiu fazer tudo.",why:"O mesmo usuário criou e aprovou no segundo nível: falta de segregação de funções. Nenhum controle técnico de rede teria impedido isso."},
  {type:"decide",time:"ter 14:00",text:"Você precisa redigir o laudo.",q:"Como tratar os problemas encontrados?",
   opts:[
    {t:"Relatar com transparência a lacuna na custódia e a alteração do original; basear as conclusões na imagem com hash conferido e nos logs de servidor preservados; e afirmar que as ações partiram da conta e do IP do tesoureiro, sem afirmar mais do que as evidências mostram",fx:{cf:25},out:"O laudo resiste à contestação: os pontos fracos já estavam declarados e as conclusões não passam do que se prova."},
    {t:"Omitir a lacuna na custódia para não enfraquecer o caso",fx:{cf:-35},out:"A defesa descobre a lacuna e passa a questionar todo o laudo."},
    {t:"Descartar todas as evidências por causa da TI",fx:{cf:-15},out:"Joga fora provas íntegras (imagem e logs) por causa de um problema localizado."},
    {t:"Afirmar que o tesoureiro em pessoa fez as transferências",fx:{cf:-15},out:"O login prova o uso da conta, não quem estava no teclado. A defesa explora isso."}],
   why:"Um laudo pericial deve ser reprodutível, objetivo e transparente sobre limitações. Atribuição de autoria exige cautela: conta e IP indicam, mas não provam sozinhos quem agiu."},
  {type:"report",time:"qua 10:00",text:"Anexo metodológico do laudo.",
   fields:[
    {l:"Pela ordem de volatilidade, coletar primeiro",o:["Memória RAM e conexões ativas","Disco rígido","Backups em fita","Documentos impressos"]},
    {l:"Como provar que a imagem é idêntica ao original",o:["Hash na coleta, recalculado e conferido depois","Carimbo do tempo, apenas","Assinatura do perito","Foto da tela"]},
    {l:"Equipamento que impede escrita no disco durante a cópia",o:["Bloqueador de escrita (write blocker)","Firewall","IPS","Token A3"]},
    {l:"Registro cronológico de quem teve posse da evidência",o:["Cadeia de custódia","Trilha de auditoria do ERP","BIA","Declaração de Aplicabilidade"]},
    {l:"Controle que falhou no ERP",o:["Segregação de funções","Criptografia em repouso","Redundância","Filtragem web"]},
    {l:"A análise deve ser feita sobre",o:["A cópia forense, nunca o original","O original, por ser mais fiel","Qualquer um dos dois","Capturas de tela"]}],
   why:"Hash garante integridade da cópia; bloqueador de escrita garante que a coleta não altere o original; cadeia de custódia garante rastreabilidade de posse. Juntos sustentam a admissibilidade da prova."}
 ]
},
{
 id:"contratosoc", grp:"e7", title:"Fiscalizando o SOC terceirizado", org:"Autarquia federal, contrato de monitoramento 24x7", lvl:"Difícil",
 tags:["Fiscalização de contratos","Lei 14.133/2021","IN SGD/ME 94/2022","IMR e glosa","Fiscal técnico/administrativo/requisitante"],
 brief:"Dia 5. Você é fiscal técnico do contrato de SOC terceirizado da autarquia. O fornecedor mandou o relatório do mês e a nota fiscal, e quer o atesto até amanhã.",
 ev:[
  {id:"tr",name:"Termo de referência (IMR)",at:0,lines:[
   "Objeto: monitoramento de segurança 24x7 (SOC)",
   "Indicador 1: incidentes críticos triados em até 30 min; meta 95% no mês",
   "Faixas do indicador 1: 90 a 94,9% → glosa de 5%; 80 a 89,9% → glosa de 10%; abaixo de 80% → glosa de 20% e abertura de processo sancionatório",
   "Indicador 2: disponibilidade do SIEM; meta 99,5% no mês; abaixo da meta → glosa de 3%",
   "Equipe mínima: 2 analistas por turno, com as certificações exigidas"]},
  {id:"forn",name:"Relatório do fornecedor",at:0,lines:[
   "Incidentes críticos: 40; triados em até 30 min: 39 (97,5%)",
   "Disponibilidade do SIEM: 99,7%",
   "Equipe: 2 analistas por turno em todos os turnos"]},
  {id:"org",name:"Dados do próprio órgão",at:0,lines:[
   "Chamados críticos registrados no sistema do órgão no mês: 52",
   "Desses, triados em até 30 min: 43",
   "Monitor externo do órgão: SIEM indisponível por 9 h no mês (mês de 720 h)",
   "Registro de acesso ao SOC: turno da madrugada com 1 analista em 18 noites",
   "Certidão negativa de débitos trabalhistas da contratada vencida em 05/09"]}
 ],
 steps:[
  {type:"point",time:"dia 5, 09:00",text:"Antes de atestar, você confere os números com fontes do próprio órgão.",q:"Aponte a linha que mostra que o relatório do fornecedor não bate para o indicador 1.",ans:["org:0","org:1"],hint:"Compare quantidades, não só percentuais.",why:"O fornecedor informou 40 críticos; o sistema do órgão registrou 52. Fiscalizar é medir com base em evidência própria, não apenas conferir o relatório da contratada."},
  {type:"decide",time:"dia 5, 11:00",text:"Pelos dados do órgão: 43 de 52 críticos no prazo, e 9 h de SIEM fora do ar em 720 h.",q:"Como fica a medição?",
   opts:[
    {t:"Calcular com os dados do órgão: 82,7% no indicador 1 (glosa de 10%) e 98,75% no indicador 2 (glosa de 3%); registrar em relatório fundamentado e dar ciência ao preposto",fx:{cf:25},out:"O fornecedor contesta, mas as evidências do órgão sustentam a medição."},
    {t:"Aceitar os números do relatório do fornecedor",fx:{cf:-30},out:"Na auditoria do TCU, o atesto sem conferência vira achado contra você."},
    {t:"Reter 100% do pagamento até o fornecedor se explicar",fx:{op:-10,cf:-15},out:"Retenção integral sem previsão contratual gera questionamento; o serviço foi parcialmente prestado."},
    {t:"Aplicar multa de 30% na hora",fx:{cf:-20},out:"Multa é sanção e exige processo administrativo com contraditório e ampla defesa."}],
   why:"O IMR (instrumento de medição de resultado) vincula o pagamento ao nível de serviço efetivamente entregue, com glosas previstas no contrato. Glosa é ajuste do pagamento; multa é sanção e depende de processo com defesa prévia."},
  {type:"point",time:"dia 5, 14:00",text:"",q:"Aponte a linha que é assunto do fiscal administrativo, e não do técnico.",ans:["org:4"],hint:"Não tem a ver com a qualidade do serviço.",why:"Regularidade fiscal e trabalhista, documentação e obrigações da contratada são acompanhadas pelo fiscal administrativo. O fiscal técnico avalia a qualidade técnica e os indicadores."},
  {type:"decide",time:"dia 6, 10:00",text:"Em 18 noites houve só 1 analista no turno, contra os 2 exigidos.",q:"Como agir?",
   opts:[
    {t:"Notificar formalmente o preposto, registrar as ocorrências, fixar prazo para correção e, se persistir, informar o gestor do contrato para avaliar abertura de processo sancionatório",fx:{cf:20,ct:5},out:"A contratada regulariza a escala em 5 dias. Tudo fica documentado no processo."},
    {t:"Ligar para o analista de plantão e cobrar informalmente",fx:{cf:-10},out:"O analista não é o responsável pela contratada; nada fica registrado."},
    {t:"Contratar outro fornecedor por conta própria",fx:{cf:-35},out:"Contratação sem processo licitatório nem dispensa fundamentada: irregular."},
    {t:"Ignorar, já que o SOC continuou funcionando",fx:{cf:-20},out:"Equipe mínima é obrigação contratual, e está ligada à queda do indicador 1."}],
   why:"A comunicação com a contratada é formal e feita via preposto, seu representante. O fiscal registra ocorrências e determina correções; sanções são conduzidas por processo próprio a partir do gestor."},
  {type:"decide",time:"dia 7",text:"É hora de receber o serviço e liberar o faturamento.",q:"Como proceder?",
   opts:[
    {t:"Emitir o recebimento provisório com a verificação técnica e o recebimento definitivo após avaliar a conformidade com o IMR, já com as glosas, seguindo os papéis da IN SGD/ME nº 94/2022; só então autorizar o faturamento",fx:{op:5,cf:25},out:"A nota é emitida com o valor ajustado. Processo limpo."},
    {t:"Atestar a nota integral para não atrasar o pagamento e discutir as glosas depois",fx:{cf:-30},out:"Glosa depois do pagamento vira pedido de devolução, bem mais difícil."},
    {t:"O fiscal técnico faz sozinho o recebimento definitivo e já aplica sanções",fx:{cf:-15},out:"Mistura papéis: sanção não é ato do fiscal técnico."},
    {t:"Não receber nada até o fim do contrato",fx:{op:-15,cf:-15},out:"Serviço prestado precisa ser recebido e pago, com os ajustes cabíveis."}],
   why:"A Lei 14.133/2021 (art. 140) prevê recebimento provisório e definitivo. Nas contratações de TIC do governo federal, a IN SGD/ME nº 94/2022 detalha os papéis: gestor do contrato e fiscais técnico, administrativo e requisitante."},
  {type:"report",time:"dia 8",text:"Relatório de fiscalização.",
   fields:[
    {l:"Nível real do indicador 1 e consequência",o:["82,7%: glosa de 10%","97,5%: sem glosa","90%: glosa de 5%","Abaixo de 80%: glosa de 20%"]},
    {l:"Papel que avalia a qualidade técnica e os indicadores do SOC",o:["Fiscal técnico","Fiscal administrativo","Fiscal requisitante","Preposto"]},
    {l:"Papel que verifica certidões e obrigações trabalhistas",o:["Fiscal administrativo","Fiscal técnico","Fiscal requisitante","Pregoeiro"]},
    {l:"Papel que representa a área que demandou a contratação, do ponto de vista do negócio",o:["Fiscal requisitante","Fiscal técnico","Fiscal administrativo","Preposto"]},
    {l:"Representante da contratada perante o órgão",o:["Preposto","Gestor do contrato","Fiscal técnico","Encarregado de dados"]},
    {l:"Aplicar multa à contratada exige",o:["Processo administrativo com contraditório e ampla defesa","Apenas decisão do fiscal técnico","Aviso por e-mail","Nada, se estiver no contrato"]},
    {l:"Lei geral de licitações e contratos em vigor",o:["Lei 14.133/2021","Lei 8.666/1993","Lei 13.709/2018","Lei 12.965/2014"]}],
   why:"43 ÷ 52 = 82,7%, faixa de 80 a 89,9%. Disponibilidade: (720 − 9) ÷ 720 = 98,75%, abaixo de 99,5%. Fiscalização bem documentada protege o órgão e o próprio fiscal."}
 ]
},
{
 id:"soc", grp:"e7", title:"Madrugada no SOC", org:"Seguradora, SOC interno", lvl:"Difícil",
 tags:["Monitoração","SIEM","Triagem","Password spraying","MITRE ATT&CK","IOC/IOA","NIST SP 800-61","Threat hunting"],
 brief:"Terça, 01:45. Você é analista N2 no SOC. A fila tem dezenas de alertas e só você e um colega N1 no turno.",
 ev:[
  {id:"fila",name:"Fila de alertas do SIEM",at:0,lines:[
   "01:12  [BAIXA]  340 falhas de login na VPN para 290 usuários diferentes, 1 tentativa por usuário, origem 185.220.x.x",
   "01:19  [ALTA]   login OK de ana.prado na VPN, origem 185.220.x.x",
   "01:20  [MÉDIA]  varredura de portas em 10.1.0.0/16 a partir do scanner de vulnerabilidades autorizado (janela agendada)",
   "01:31  [ALTA]   regra criada na caixa de ana.prado: encaminhar mensagens com 'pagamento' ou 'boleto' para endereço externo",
   "01:40  [ALTA]   ana.prado acessou 1.200 arquivos do SharePoint financeiro em 3 minutos",
   "Relógio do firewall 3 min adiantado em relação ao AD (NTP não configurado)"]},
  {id:"hunt",name:"Consulta de hunting",at:4,lines:[
   "Logins bem-sucedidos com origem 185.220.x.x nos últimos 30 dias: ana.prado, marcos.teles",
   "Regras de encaminhamento externo criadas nos últimos 30 dias: ana.prado (hoje), marcos.teles (há 9 dias)",
   "marcos.teles: usuário sem MFA (grupo de exceção)",
   "Nenhum alerta gerado para marcos.teles"]}
 ],
 steps:[
  {type:"point",time:"01:45",text:"Você olha a fila.",q:"Aponte o alerta classificado como baixo que, na verdade, é o início do ataque.",ans:["fila:0"],hint:"Muitos usuários, uma tentativa cada.",why:"Uma tentativa por usuário, muitos usuários, mesma origem: password spraying. O atacante testa uma senha comum em muitas contas para não disparar bloqueio por tentativas. A regra que só olha falhas por conta não pega."},
  {type:"point",time:"01:47",text:"",q:"Aponte o alerta que corresponde a uma atividade legítima conhecida.",ans:["fila:2"],hint:"Algo que o próprio time agendou.",why:"Varredura do scanner autorizado, na janela agendada. Documentar exceções e ajustar a regra reduz ruído e fadiga de alertas."},
  {type:"decide",time:"01:50",text:"A conta da Ana está sendo usada agora.",q:"O que fazer primeiro?",
   opts:[
    {t:"Abrir incidente, desabilitar a conta, revogar sessões e tokens, remover a regra de encaminhamento, bloquear a origem e acionar o plantão para redefinir a senha com MFA",fx:{ct:25,cf:10},out:"Às 02:03 o acesso cai. A regra de encaminhamento some antes do primeiro e-mail de boleto do dia."},
    {t:"Investigar primeiro o alerta do scanner",fx:{ct:-15},out:"Você gasta 20 minutos numa atividade legítima."},
    {t:"Esperar a Ana chegar às 9h para confirmar se foi ela",fx:{ct:-30},out:"Até as 9h o atacante baixa o SharePoint financeiro inteiro."},
    {t:"Apagar logs antigos para dar espaço ao SIEM",fx:{ct:-10,cf:-15},out:"Destrói evidência justamente quando ela mais importa."}],
   why:"Triagem é priorização por impacto e evidência de comprometimento. Sessão ativa com persistência (regra de encaminhamento) e coleta de dados em andamento exigem contenção imediata. Revogar sessões importa: trocar só a senha não derruba tokens já emitidos."},
  {type:"point",time:"02:30",text:"Montando a linha do tempo, os horários não batem.",q:"Aponte a linha que atrapalha a correlação.",ans:["fila:5"],hint:"Não é um ataque, é infraestrutura.",why:"Sem sincronização de horário (NTP), eventos de fontes diferentes ficam fora de ordem. Correlação no SIEM e valor probatório dependem de horário confiável."},
  {type:"decide",time:"03:00",text:"A Ana está contida. Seu colega quer fechar o incidente.",q:"E agora?",
   opts:[
    {t:"Caçar pelo comportamento do atacante, não só pelo IP: outros logins da mesma origem e outras regras de encaminhamento em todas as caixas",fx:{ct:25},out:"A consulta revela um segundo comprometido."},
    {t:"Bloquear o IP e fechar o incidente",fx:{ct:-20},out:"Um comprometimento anterior segue ativo, sem ninguém saber."},
    {t:"Reinstalar todas as estações da empresa",fx:{op:-25,ct:5},out:"Dias de indisponibilidade, e o problema estava nas contas de nuvem, não nas estações."},
    {t:"Esperar novos alertas",fx:{ct:-15},out:"O segundo comprometimento nunca gerou alerta."}],
   why:"Threat hunting é a busca proativa por ameaças que não geraram alerta, guiada por hipóteses e pelas técnicas do adversário (TTPs, mapeáveis no MITRE ATT&CK). IOCs, como IPs, mudam fácil; comportamento muda menos."},
  {type:"point",time:"03:20",text:"A consulta de hunting voltou.",q:"Aponte a linha que explica por que o segundo comprometimento nunca gerou alerta nem foi barrado.",ans:["hunt:2"],hint:"O que o Marcos tem de diferente da Ana?",why:"Conta sem MFA num grupo de exceção: a senha acertada no spraying bastou. E as regras de detecção focavam em sinais que o atacante evitou nesse caso."},
  {type:"report",time:"09:00",text:"Relatório do incidente e lições aprendidas.",
   fields:[
    {l:"Técnica usada contra a VPN",o:["Password spraying","Força bruta em um único usuário","Credential stuffing","Pass-the-hash"]},
    {l:"O IP 185.220.x.x é um",o:["Indicador de comprometimento (IOC)","Indicador de ataque (IOA)","TTP","CVE"]},
    {l:"Base de conhecimento de táticas e técnicas de adversários",o:["MITRE ATT&CK","CVSS","ISO 22301","IEC 62443"]},
    {l:"Fases do ciclo de resposta a incidentes do NIST SP 800-61 Rev. 2",o:["Preparação; detecção e análise; contenção, erradicação e recuperação; pós-incidente","Identificar; proteger; detectar; responder","Planejar; fazer; checar; agir","Coleta; relacionamento; exploração; execução"]},
    {l:"Tempo médio entre o início de um ataque e sua detecção",o:["MTTD","MTTR","RTO","RPO"]},
    {l:"Regra de encaminhamento externo criada pelo atacante é, no ATT&CK, principalmente",o:["Coleta/exfiltração de e-mail e persistência","Reconhecimento","Movimentação lateral por SMB","Negação de serviço"]}],
   why:"Credential stuffing usa pares de login e senha vazados; spraying testa poucas senhas comuns em muitas contas. A Rev. 3 do SP 800-61 (2025) reorganizou a resposta a incidentes em torno das funções do CSF 2.0, mas o ciclo da Rev. 2 ainda é muito cobrado."}
 ]
},
{
 id:"auditdr", grp:"e7", title:"A auditoria que achou o DR de papel", org:"Cooperativa de crédito", lvl:"Muito difícil",
 tags:["Auditoria e compliance","Continuidade de TI","RTO/RPO","Sites quente/morno/frio","Segurança de dados","Mascaramento","Segregação de funções"],
 brief:"Segunda. Você é auditora de TI da cooperativa e está fechando a auditoria anual, que inclui o teste de recuperação de desastres do sistema principal.",
 ev:[
  {id:"chk",name:"Papéis de trabalho",at:0,lines:[
   "Política de backup aprovada: 3 cópias, 2 mídias diferentes, 1 fora do local",
   "Amostra: 25 de 25 restaurações registradas como 'OK'; nenhuma com evidência anexada",
   "Usuário dba_joao é administrador do banco e aprova as próprias mudanças em produção",
   "7 ex-funcionários com contas ativas, desligados há mais de 90 dias",
   "Base de homologação com CPF e saldo reais dos cooperados"]},
  {id:"dr",name:"Teste de DR",at:4,lines:[
   "Site secundário: servidores ligados, dados replicados a cada 4 h",
   "Exigido para o sistema principal: RTO 2 h, RPO 15 min",
   "Teste de 20/09: sistema principal voltou em 6 h 40 min",
   "Perda de dados medida no teste: 3 h 50 min de transações",
   "Runbook de failover cita servidores desativados em 2024"]}
 ],
 steps:[
  {type:"point",time:"seg 09:00",text:"Você revisa os papéis de trabalho.",q:"Aponte a linha com problema de evidência de auditoria.",ans:["chk:1"],hint:"Afirmar não é comprovar.",why:"Registro de 'OK' sem evidência (log, print datado, relatório de restauração) não é evidência objetiva. O auditor precisa de evidência suficiente e apropriada para concluir."},
  {type:"point",time:"seg 10:00",text:"",q:"Aponte a falha no ciclo de vida de identidades.",ans:["chk:3"],hint:"Pense em quem já saiu da empresa.",why:"Desligamento sem revogação de acesso. É não conformidade de controle de acesso (gestão de identidades) e um vetor clássico de abuso."},
  {type:"point",time:"seg 11:00",text:"",q:"Aponte a linha que é um problema de segurança de dados, não de backup nem de acesso.",ans:["chk:4"],hint:"Onde há dados reais sem necessidade?",why:"Ambientes de teste costumam ter controles mais fracos. Dados pessoais reais em homologação violam necessidade e segurança."},
  {type:"decide",time:"seg 14:00",text:"O gerente de sistemas diz que precisa de dados 'parecidos com os reais' para testar.",q:"Qual recomendação?",
   opts:[
    {t:"Mascarar ou pseudonimizar os dados na cópia para homologação, ou usar dados sintéticos, mantendo formato e consistência; restringir o acesso ao ambiente",fx:{ct:15,cf:20},out:"Os testes continuam funcionando e um vazamento de homologação deixa de expor cooperados."},
    {t:"Cifrar o banco de homologação e manter os dados reais",fx:{ct:5,cf:-10},out:"Quem acessa a aplicação de homologação continua vendo tudo em claro."},
    {t:"Acabar com o ambiente de homologação",fx:{op:-20,cf:0},out:"Mudanças passam a ir direto para produção. O risco só mudou de lugar."},
    {t:"Apagar só a coluna de CPF",fx:{cf:-5},out:"Nome, saldo e endereço continuam identificando as pessoas."}],
   why:"Mascaramento substitui valores reais por fictícios preservando o formato. Na LGPD, dado anonimizado (sem reidentificação por meios razoáveis) sai do escopo da lei; dado pseudonimizado continua sendo dado pessoal. O controle 8.11 (mascaramento de dados) é novidade da ISO/IEC 27002:2022."},
  {type:"point",time:"ter 09:00",text:"Chegou o relatório do teste de DR.",q:"Aponte a linha que mostra que a arquitetura não cumpre o RPO nem em teoria.",ans:["dr:0"],hint:"Compare a frequência de replicação com o que é exigido.",why:"Replicação a cada 4 h significa perder até 4 h de dados; o RPO exigido é 15 min. Mesmo um teste perfeito não cumpriria. E o RTO também estourou: 6 h 40 min contra 2 h."},
  {type:"decide",time:"ter 11:00",text:"A diretoria pergunta o que fazer.",q:"Qual recomendação de continuidade?",
   opts:[
    {t:"Replicação contínua (síncrona ou quase) para um site quente, runbook atualizado e testes de failover periódicos com metas de RTO/RPO",fx:{op:15,ct:10,cf:15},out:"O teste seguinte fecha em 1 h 20 min com perda de 2 minutos."},
    {t:"Mudar o RPO no documento para 4 h, para passar a constar como conforme",fx:{cf:-30},out:"O número no papel muda; o impacto real para os cooperados, não. E sem decisão do negócio."},
    {t:"Comprar mais armazenamento para o site secundário",fx:{cf:-5},out:"Espaço não era o problema; frequência e automação eram."},
    {t:"Trocar a replicação por backup semanal em fita",fx:{op:-15,cf:-20},out:"Piora RTO e RPO de uma vez."}],
   why:"Site quente: infraestrutura pronta e dados quase em tempo real. Morno: infraestrutura pronta, dados defasados. Frio: espaço e energia, pouco mais. Na ISO/IEC 27001:2022, o controle 5.30 trata da prontidão de TIC para continuidade."},
  {type:"decide",time:"qua 10:00",text:"Hora de escrever o relatório de auditoria.",q:"Como registrar os achados?",
   opts:[
    {t:"Registrar cada não conformidade com critério (requisito ou controle), evidência objetiva, causa, risco e recomendação, e pedir plano de ação com responsáveis e prazos",fx:{cf:25},out:"A diretoria aprova o plano; o acompanhamento fica agendado."},
    {t:"Apontar só verbalmente, para não expor a equipe",fx:{cf:-25},out:"Sem registro, nada é acompanhado."},
    {t:"Corrigir você mesma as contas de ex-funcionários e o runbook",fx:{cf:-15},out:"O auditor perde independência ao operar aquilo que audita."},
    {t:"Omitir o DR porque 'é difícil de resolver'",fx:{cf:-30},out:"Omissão de achado relevante compromete toda a auditoria."}],
   why:"Auditoria exige objetividade, imparcialidade e independência: o auditor não audita o próprio trabalho nem executa as correções. Achados bem estruturados (critério, condição, causa, efeito, recomendação) viram plano de ação."},
  {type:"report",time:"qua 17:00",text:"Resumo executivo.",
   fields:[
    {l:"Site com infraestrutura pronta e dados quase em tempo real",o:["Site quente","Site morno","Site frio","Ambiente de homologação"]},
    {l:"Princípio violado pelo dba_joao",o:["Segregação de funções","Minimização","Neutralidade","Não repúdio"]},
    {l:"Estratégia 3-2-1 significa",o:["3 cópias, em 2 mídias diferentes, 1 fora do local","3 backups por dia, 2 dias de retenção, 1 teste","3 servidores, 2 sites, 1 nuvem","3 níveis de acesso, 2 fatores, 1 auditor"]},
    {l:"Dado pseudonimizado, na LGPD",o:["Continua sendo dado pessoal","Deixa de ser dado pessoal","Vira dado sensível","É sempre irreversível"]},
    {l:"Controle da ISO/IEC 27001:2022 sobre prontidão de TIC para continuidade",o:["5.30","8.9","5.7","8.28"]},
    {l:"O teste de DR mostrou",o:["RTO e RPO descumpridos","Só RTO descumprido","Só RPO descumprido","Ambos cumpridos"]}],
   why:"Backup sem teste de restauração é esperança, não controle. E continuidade de TI só existe quando RTO e RPO são testados e comprovados."}
 ]
}
];

/* ============================================================ ESTADO */
const LS="sala-crise-v1";
let SAVE={best:{},mode:"dificil"};
try{const r=localStorage.getItem(LS); if(r) SAVE=Object.assign(SAVE,JSON.parse(r));}catch(e){}
const persist=()=>{try{localStorage.setItem(LS,JSON.stringify(SAVE));}catch(e){}};

/* ============================================================
   COMO LER ESTA EVIDÊNCIA — por tipo de evidência, reutilizável entre casos.
   Explica os CAMPOS, nunca o que eles provam neste caso.
   ============================================================ */
const HOWTO={
 mail:{d:"Cabeçalho e corpo de um e-mail como o servidor o entregou. O que aparece para o usuário e o que vem por baixo nem sempre coincidem.",
  c:[["De","Nome de exibição e endereço real. O nome é livre: quem envia escolhe o que quiser."],["Domínio","O que vem depois do @. É ele, e não o nome, que diz de qual organização o e-mail saiu."],["Retorno / Reply-To","Para onde a resposta vai de verdade, que pode ser diferente do remetente."],["SPF / DKIM / DMARC","Checagens que dizem se o servidor tinha autorização para enviar por aquele domínio."]]},
 siem:{d:"SIEM reúne num só lugar os registros de várias fontes (proxy, AD, VPN, antivírus) em ordem de tempo.",
  c:[["Fonte","A sigla depois do horário diz de qual sistema veio a linha: PROXY, AD, VPN, EDR."],["PROXY","Registra a navegação: quem acessou qual endereço e por qual método (GET lê, POST envia dados)."],["AD","Active Directory: contas, grupos e permissões. Mostra quem foi incluído em quê e quando."],["VPN","Acesso remoto: usuário, IP de origem e se o segundo fator (MFA) foi exigido."],["Origem","IP de onde partiu a conexão, geralmente com o país entre parênteses."]]},
 fila:{d:"Fila de alertas do SIEM ainda não triados, cada um com a severidade que a regra atribuiu automaticamente.",
  c:[["[BAIXA] [MÉDIA] [ALTA]","Severidade sugerida pela regra. É um palpite da ferramenta, não um veredito: alertas baixos somados podem valer mais que um alto isolado."],["Horário","A ordem importa: alertas próximos no tempo costumam ser partes do mesmo evento."],["Origem 185.220.x.x","Faixa de IP resumida, para agrupar tentativas que vêm do mesmo lugar."]]},
 hunt:{d:"Resultado de uma busca feita por você (threat hunting), procurando o mesmo padrão em outros lugares e em janelas maiores.",
  c:[["Janela","O período consultado. Hunting serve justamente para olhar para trás, além do alerta de hoje."],["Regra de encaminhamento","Configuração da caixa postal que copia ou desvia mensagens automaticamente para outro endereço."],["Grupo de exceção","Conjunto de contas dispensadas de algum controle, como o segundo fator."]]},
 fw:{d:"Registros de firewall e de VPN: quem conectou de onde, para onde e em qual porta.",
  c:[["Porta","Número que identifica o serviço. 502 é Modbus/TCP, 3389 é RDP, 445 é SMB, 443 é HTTPS."],["-> e <-","A seta indica o sentido da conexão: quem procurou quem."],["MFA: não","Autenticação em dois fatores não foi exigida naquele acesso."],["Regra any/any","Regra de firewall que libera qualquer origem para qualquer destino. É o oposto do menor privilégio."],["Write Single Register","Comando Modbus que grava um valor direto na memória do controlador."]]},
 wids:{d:"Varredura do ar feita por um sensor de rede sem fio, listando cada ponto de acesso que ele enxerga.",
  c:[["SSID","O nome da rede, aquele que aparece na lista do celular. Qualquer equipamento pode anunciar qualquer nome."],["BSSID","O endereço MAC do rádio do ponto de acesso. Esse é o identificador físico, único por equipamento."],["Canal","A frequência usada. Dois APs com o mesmo SSID em canais diferentes são equipamentos diferentes."],["WPA2-Enterprise / PSK / aberta","Como a rede autentica. Enterprise usa usuário e senha por pessoa; PSK usa uma senha única; aberta não pede nada."],["cadastrado","Se o equipamento consta no inventário autorizado da organização."],["dBm","Força do sinal. Quanto mais perto de zero, mais forte: -38 dBm é muito mais forte que -70 dBm."]]},
 dhcp:{d:"Log do switch e do serviço DHCP, que é quem distribui endereços IP para quem entra na rede.",
  c:[["Gi0/14","Identificação física da porta do switch: gabinete, módulo e número da porta."],["DHCPDISCOVER","Pedido de um cliente procurando um servidor para lhe dar um endereço."],["DHCPOFFER","Resposta de um servidor oferecendo endereço, gateway e DNS."],["Pool","A faixa de endereços que o servidor legítimo tem disponível para emprestar."],["gateway= / DNS=","Quem o cliente vai usar como saída da rede e para resolver nomes. Quem define isso vê o tráfego."]]},
 arp:{d:"Tabela ARP de uma estação: a relação entre cada IP e o endereço MAC que respondeu por ele.",
  c:[["IP","Endereço lógico, de camada 3. Pode ser reconfigurado por software."],["MAC","Endereço físico da placa de rede, de camada 2. É por ele que o quadro chega ao destino."],["dinâmico","O par IP–MAC foi aprendido pela rede, e não fixado manualmente. Aprendizado dinâmico aceita quem responder primeiro."]]},
 rel:{d:"Relato de quem estava lá, com horários aproximados. Testemunho é ponto de partida, não prova técnica.",
  c:[["Horário","Anotado por pessoas, então costuma divergir alguns minutos dos logs."],["Reconectar","Quando o dispositivo perde o sinal e escolhe sozinho outro ponto de acesso com o mesmo nome."]]},
 ihm:{d:"Alarmes da IHM, a tela de supervisão que o operador usa para acompanhar e comandar o processo físico.",
  c:[["IHM","Interface Homem-Máquina: onde o operador vê o processo e envia comandos."],["Setpoint","O valor que o sistema deve perseguir, por exemplo a dosagem desejada de cloro."],["mg/L","Miligramas por litro: a concentração medida na saída."],["origem","Qual estação enviou o comando que mudou o valor."]]},
 ctx:{d:"Contexto operacional: os números do processo físico que definem o que é seguro e quanto tempo você tem.",
  c:[["Reservatório","Quanto tempo a população continua abastecida se a produção parar agora."],["Limite operacional","O teto adotado pela própria estação para o parâmetro, dentro do que a norma permite."],["Painel local","Comando manual no campo, independente da rede."]]},
 inv:{d:"Inventário de ativos de OT (tecnologia de operação): o que existe na planta, em qual versão e em qual rede.",
  c:[["CLP / PLC","Controlador Lógico Programável: o computador industrial que aciona bombas e válvulas."],["Firmware","O software embarcado do equipamento. A versão define quais falhas conhecidas ele tem."],["VLAN","Rede lógica separada dentro do mesmo switch. Equipamentos na mesma VLAN se alcançam diretamente."],["Alerta público","Vulnerabilidade já divulgada pelo fabricante ou por um centro de resposta, com versões afetadas."]]},
 cert:{d:"Dados de um certificado digital e da cadeia que o sustenta.",
  c:[["Titular","A pessoa ou empresa dona do par de chaves."],["Emissor","A Autoridade Certificadora que assinou este certificado."],["Cadeia","A sequência de confiança, da AC Raiz até o certificado final. Se um elo cai, o que está abaixo cai junto."],["A1 / A3","A1 guarda a chave privada em arquivo no computador; A3 guarda em token ou cartão, de onde a chave não sai."],["LCR / OCSP","As duas formas de perguntar se um certificado foi revogado antes do vencimento."]]},
 val:{d:"Saída de um validador de assinatura digital: o que a ferramenta conseguiu ou não conseguiu comprovar.",
  c:[["Assinatura válida","Significa que o conteúdo não mudou depois de assinado. Não diz quem assinou nem quando."],["SHA-256","Resumo criptográfico do arquivo. Qualquer alteração, por menor que seja, muda o resumo inteiro."],["Carimbo do tempo","Data atestada por uma Autoridade de Carimbo do Tempo (ACT), independente do relógio de quem assinou."],["Relógio local","A data veio da máquina do signatário, que o próprio usuário pode ajustar."]]},
 mails:{d:"E-mails internos entregues por uma das partes. Servem para reconstruir quem sabia o quê e quando.",
  c:[["Data","Monte a ordem dos fatos antes de interpretar qualquer um deles isoladamente."],[".pfx","Arquivo que contém o certificado junto com a chave privada, protegido por senha."]]},
 noc:{d:"Painel do centro de operação de rede, com o volume de tráfego em tempo real.",
  c:[["Gbps","Gigabits por segundo. Compare sempre com a linha de base do horário, não com zero."],["Backbone","A espinha dorsal da rede do provedor, por onde todo o tráfego passa."],["Destino dominante","O IP que está recebendo a maior fatia do tráfego naquele instante."]]},
 ids:{d:"Alertas de um sistema de detecção de intrusão, que inspeciona o tráfego procurando padrões conhecidos.",
  c:[["Consulta ANY","Pergunta de DNS que pede todos os registros de um domínio de uma vez, gerando resposta grande."],["monlist","Comando antigo de NTP que devolve uma lista longa a partir de um pedido curto."],["Origem forjada","O pacote traz como remetente um IP que não é o de quem enviou (IP spoofing)."],["Fator de amplificação","Quantas vezes a resposta é maior que a pergunta."]]},
 mkt:{d:"Pedido interno de outra área. Entra na investigação porque a resposta a ele também é uma decisão sua.",
  c:[["Priorizar / reduzir velocidade","Tratar pacotes de forma diferente conforme a aplicação ou o serviço de destino."]]},
 oficio:{d:"Documento oficial de uma autoridade solicitando dados. O que ele pede, e com qual base, define o que pode ser entregue.",
  c:[["Registros de conexão","Data, hora, duração e IP de origem de um acesso. Não incluem o que foi dito."],["Conteúdo","As mensagens em si. Tem proteção diferente e mais rígida que os registros."],["Ofício","Pedido administrativo da autoridade. Não é o mesmo que ordem judicial."]]},
 recl:{d:"Reclamações recebidas de usuários, responsáveis e escolas. São o sintoma; a causa está na configuração do produto.",
  c:[["Sorteio de itens","Compra em que o usuário paga sem saber o que vai receber."],["Chat aberto","Qualquer conta pode iniciar conversa com qualquer outra, sem filtro ou vínculo."]]},
 cad:{d:"O fluxo de cadastro do produto, passo a passo, como o usuário encontra hoje.",
  c:[["Campo livre","O usuário digita o que quiser, sem nenhuma checagem contra outra fonte."],["Padrão","O valor que vale para quem não mexe em nada. É o que a maioria absoluta dos usuários terá."],["Vínculo com responsável","Existência de um adulto associado à conta, com poder de autorizar e acompanhar."]]},
 alerta:{d:"Alerta técnico sobre exposição de dados, com o que vazou e desde quando.",
  c:[["Bucket público","Área de armazenamento em nuvem acessível por qualquer pessoa com o endereço, sem autenticação."],["Campos","Quais atributos estavam no arquivo. É essa lista que define a gravidade para quem foi exposto."]]},
 waf:{d:"Log do WAF, o filtro que fica na frente da aplicação lendo cada requisição.",
  c:[["Modo detecção x bloqueio","Em detecção o WAF só registra e deixa passar; em bloqueio ele barra."],["GET /caminho?param=valor","O que veio depois da interrogação é entrada do usuário e pode ser manipulado."],["Código 200","A aplicação respondeu com sucesso. Sucesso aqui é do ponto de vista do servidor, não do seu."],["Tempo e tamanho","Uma resposta muito mais lenta ou muito maior que as outras indica que algo diferente foi devolvido."]]},
 cod:{d:"Trecho do código-fonte da aplicação, como o desenvolvedor enviou.",
  c:[["Concatenação","Juntar texto do usuário dentro de um comando montado como string."],["Consulta parametrizada","O banco recebe o comando e os dados separadamente, e trata o dado sempre como dado."],["@GetMapping","Anotação que liga uma rota HTTP a uma função do servidor."],["Comentário //","Texto ignorado pelo programa, mas que muitas vezes revela o que o time já sabia."]]},
 sup:{d:"Inventário de exposição: tudo o que pode ser alcançado a partir da internet.",
  c:[["Produção x homologação","Produção atende o cidadão; homologação é ambiente de teste, normalmente com controles mais frouxos."],["Exposta à internet","Alcançável por qualquer pessoa no mundo, sem passar por VPN ou rede interna."],["Swagger UI","Página que documenta e lista todos os endereços da API, com os parâmetros de cada um."]]},
 sit:{d:"Fotografia do momento em que a investigação começa: o estado físico das coisas e das pessoas.",
  c:[["Ligado / tela bloqueada","Um equipamento ligado guarda em memória informação que se perde no desligamento."],["Afastado","Situação funcional da pessoa, que muda o que pode ou não ser feito com os equipamentos dela."]]},
 cust:{d:"Formulário de cadeia de custódia: o histórico de posse de cada item, do momento da coleta até agora.",
  c:[["Lacre","Numeração única que prova que o item não foi aberto entre dois pontos do percurso."],["Bloqueador de escrita","Dispositivo que permite ler o disco sem alterar nada nele."],["Imagem","Cópia bit a bit do disco. A análise se faz na imagem, nunca no original."],["Hash da imagem","Resumo calculado na coleta e reconferido depois, para provar que a cópia não mudou."],["Transferência de posse","Toda troca de mãos precisa de quem, quando, por quê e assinatura."]]},
 tl:{d:"Linha do tempo montada a partir de vários sistemas, já em ordem cronológica.",
  c:[["Sistema de origem","A sigla antes do evento diz de onde a linha veio: VPN, ERP, AD."],["Mesmo usuário","Repare quando a mesma conta aparece em passos que deveriam ser de pessoas diferentes."],["Perfil acumulado","Uma conta com permissões que, somadas, permitem completar um processo inteiro sozinha."]]},
 tr:{d:"Termo de referência com o Instrumento de Medição de Resultado (IMR): o que foi contratado e como se mede.",
  c:[["Indicador","O que será medido, com a meta e o período de apuração."],["Meta","O valor mínimo aceitável. Abaixo dela começam as consequências previstas."],["Faixa","Intervalo de desempenho com a consequência correspondente."],["Glosa","Desconto no pagamento quando o serviço fica abaixo do contratado. Não é multa nem sanção."]]},
 forn:{d:"Relatório de desempenho enviado pela própria contratada, com os números que ela apurou.",
  c:[["Autodeclaração","Números produzidos por quem está sendo medido. Precisam ser conferidos contra fonte independente."],["Percentual","Confira sempre o numerador e o denominador: a conta muda se a base de incidentes for outra."]]},
 org:{d:"Os mesmos indicadores apurados pelo próprio órgão, por fontes que não passam pela contratada.",
  c:[["Sistema do órgão","Registro interno, independente do relatório da contratada."],["Monitor externo","Medição automática de disponibilidade, feita de fora do ambiente do fornecedor."],["Base de cálculo","Total de horas ou de chamados do período, usado como denominador."]]},
 chk:{d:"Papéis de trabalho da auditoria: o que a política manda e o que a amostra encontrou.",
  c:[["Amostra","Subconjunto examinado. O tamanho e o critério de escolha definem o quanto a conclusão se sustenta."],["Evidência anexada","O comprovante do que foi feito. Registro sem evidência é declaração, não prova."],["3-2-1","Regra usual de backup: três cópias, em duas mídias diferentes, uma fora do local."]]},
 dr:{d:"Resultado do teste de recuperação de desastre, comparado ao que o negócio exige.",
  c:[["Site secundário","Ambiente alternativo que assume a operação quando o principal cai."],["RTO","Tempo máximo aceitável até o serviço voltar."],["RPO","Quantidade máxima de dados que se aceita perder, medida em tempo desde o último ponto bom."],["Replicação","De quanto em quanto tempo os dados são copiados para o site secundário. Define o RPO possível."]]},
 bkp:{d:"Mapa dos backups e réplicas: para onde cada sistema copia, com que frequência e com qual proteção.",
  c:[["Imutável","Cópia que não pode ser apagada nem alterada dentro do prazo de retenção, nem por administrador."],["Mesmo domínio AD","Se o backup usa as mesmas credenciais da rede, quem domina a rede alcança o backup."],["Sempre online","Destino permanentemente acessível pela rede, e por isso alcançável por quem já entrou."],["Réplica","Cópia sincronizada e contínua. Repete no destino, rapidamente, o que acontece na origem."]]},
 bia:{d:"Análise de impacto no negócio (BIA): quanto tempo cada processo aguenta parado e quanto dado pode perder.",
  c:[["RTO","Tempo máximo tolerável de indisponibilidade daquele processo."],["RPO","Perda máxima tolerável de dados, contada desde o último ponto de recuperação."],["Prioridade","Quando os recursos não dão para todos ao mesmo tempo, o BIA é quem decide a ordem."]]}
};

/* ============================================================
   COLEGA DE PLANTÃO — Dani Queiroz, Jurídico e Compliance.
   Só fala de legislação, normas e conduta. Nunca de técnica, nunca da resposta.
   "at" é a etapa em que a mensagem chega: sempre ANTES da decisão que a exige.
   ============================================================ */
const COLEGA={nome:"Dani Queiroz",papel:"Jurídico e Compliance · plantão",ini:"DQ"};
const INTRO={at:0,t:"Oi, sou a Dani",
 b:"Prazer! Sou do jurídico daqui e vou acompanhar esse caso junto com você. Enquanto você trabalha, de vez em quando eu mando uma mensagem por aqui sobre a parte jurídica e os processos que a gente precisa seguir. Não precisa responder nem parar o que está fazendo. Se passar batido, é só clicar no chat que as mensagens ficam todas guardadas aqui."};
const MENTOR={
 rotasul:[
  {at:1,n:"ISO/IEC 27035",t:"Como esse tipo de caso costuma andar",
   b:"Enquanto você investiga, eu vou anotando o lado jurídico. Lembra que a gestão de incidentes tem fases próprias na ISO/IEC 27035: planejar, detectar e reportar, avaliar e decidir, responder e aprender. O controle equivalente na ISO/IEC 27001 é o de gestão de incidentes de segurança da informação."},
  {at:5,n:"LGPD art. 48",t:"Se houve dado pessoal envolvido, o relógio já começou",
   b:"Atenção ao seguinte: pela LGPD, art. 48, o controlador comunica à ANPD e aos titulares quando o incidente puder acarretar risco ou dano relevante. A Resolução CD/ANPD nº 15/2024 fixou o prazo em 3 dias úteis a contar do conhecimento. Criptografia sem cópia de dados e cópia de dados são situações diferentes, e é essa diferença que decide se a comunicação é obrigatória."}],
 clinica:[
  {at:1,n:"LGPD art. 5º II e art. 11",t:"Aqui o dado é sensível",
   b:"Só pra você já entrar com isso na cabeça: prontuário é dado de saúde, e dado de saúde é pessoal sensível pela LGPD (art. 5º, II). O tratamento segue o art. 11, que é mais restrito que a regra geral. Na prática, o mesmo incidente pesa mais aqui do que pesaria numa loja."},
  {at:3,n:"ANPD · ISO 27799",t:"Credencial de prontuário exposta é comunicação provável",
   b:"Se credencial de acesso a prontuário circulou, a chance de virar comunicação à ANPD e aos pacientes é alta (LGPD art. 48). Some a isso o sigilo profissional da área da saúde. Para controles específicos do setor existe a ISO 27799, que traduz a ISO/IEC 27002 para saúde."}],
 eta:[
  {at:1,n:"IEC 62443",t:"Em OT a régua é outra",
   b:"Faço questão de falar disso logo no começo: em ambiente industrial a ordem de prioridade é segurança das pessoas, depois integridade do processo, e só então disponibilidade e confidencialidade. É o inverso da TI administrativa. A família IEC 62443 é a referência, com a ideia de zonas e condutos: separar por criticidade e controlar toda passagem entre as partes."},
  {at:3,n:"Potabilidade · ISO 22301",t:"Existe autoridade sanitária nessa história",
   b:"Não esquece que a água tratada tem regra própria de potabilidade do Ministério da Saúde, e alteração de parâmetro na saída pode gerar dever de comunicar a vigilância sanitária, independente do lado cibernético. E, para o plano de retomada, a referência de continuidade de negócios é a ISO 22301."}],
 contrato:[
  {at:1,n:"MP 2.200-2/2001",t:"O que a lei presume, e o que ela não presume",
   b:"Contexto jurídico do caso: a ICP-Brasil vem da MP 2.200-2/2001. Documento assinado com certificado ICP-Brasil tem presunção de veracidade em relação ao signatário. Presunção é relativa: admite prova em contrário. Vale separar bem três coisas que costumam ser confundidas: integridade, autoria e data."},
  {at:2,n:"ISO/IEC 27037 · conduta",t:"Você é perito, não advogado da parte",
   b:"Lembrete de conduta: o laudo tem que ser reprodutível e imparcial, e precisa dizer com clareza onde estão os limites do que a técnica consegue afirmar. Quem paga não muda a conclusão. Para tratamento de evidência digital, a referência é a ISO/IEC 27037."}],
 netsul:[
  {at:1,n:"Marco Civil art. 9º",t:"Neutralidade de rede",
   b:"Deixando anotado desde já: o Marco Civil da Internet (Lei 12.965/2014), art. 9º, obriga a tratar de forma isonômica os pacotes, vedada discriminação por conteúdo, origem, destino, serviço ou aplicação. As exceções são só requisitos técnicos indispensáveis e priorização de serviços de emergência, detalhadas no Decreto 8.771/2016. Interesse comercial não entra na lista."},
  {at:3,n:"Marco Civil arts. 10, 13, 15 e 22",t:"Registro é uma coisa, conteúdo é outra",
   b:"Presta atenção nessa distinção, porque é onde a gente mais vê pedido sendo respondido errado: registro de conexão e registro de acesso a aplicação são dados de metadados, guardados por 1 ano e 6 meses respectivamente (arts. 13 e 15). O CONTEÚDO das comunicações só pode ser entregue mediante ordem judicial (arts. 7º, III e 10, §2º). Ofício de delegacia não é ordem judicial. O art. 22 lista os requisitos do pedido."},
  {at:4,n:"Anatel Res. 740/2020",t:"E tem a obrigação setorial",
   b:"Como somos prestadora de telecom, além do lado LGPD existe a Resolução Anatel nº 740/2020: política de segurança cibernética, gestão de riscos e notificação de incidentes relevantes à Anatel. Notificar a ANPD não substitui isso, e avisar cliente também não."}],
 pixel:[
  {at:1,n:"ECA Digital · LGPD art. 14",t:"Público infantil muda tudo",
   b:"Antes de qualquer decisão: o ECA Digital (Lei 15.211/2025) exige verificação confiável de idade, vinculação a responsável e veda certos modelos de monetização para esse público. Em paralelo, a LGPD art. 14 manda tratar dados de crianças e adolescentes sempre no melhor interesse, com consentimento específico e destacado de um dos pais ou responsável."},
  {at:2,n:"ISO/IEC 29100 · LGPD art. 48",t:"Minimização, e o que fazer se vazou",
   b:"Dois pontos que eu preciso deixar registrados aqui: a ISO/IEC 29100 traz os princípios de privacidade, e o da minimização é o que mais aparece aqui — coletar só o indispensável para a finalidade, que na LGPD é o princípio da necessidade. E, se dado de criança foi exposto, a comunicação à ANPD e aos responsáveis vem pelo art. 48, com o agravante do público."}],
 api:[
  {at:1,n:"LGPD no setor público",t:"Órgão público também responde",
   b:"Só alinhando: a LGPD se aplica ao poder público (arts. 23 a 30). O órgão trata dado do cidadão para execução de política pública, o que dispensa consentimento, mas não dispensa segurança, finalidade nem transparência. Os controles de referência estão na ISO/IEC 27001 e 27002."},
  {at:4,n:"LGPD art. 48 · ANPD",t:"Se o cadastro do cidadão saiu, tem comunicação",
   b:"Com acesso indevido a cadastro de cidadão, prepare a comunicação à ANPD e aos titulares (art. 48), no prazo de 3 dias úteis da Resolução CD/ANPD nº 15/2024. E, em órgão público, some a isso o dever de transparência ativa: a comunicação ao titular precisa ser compreensível, não um comunicado técnico."}],
 forense:[
  {at:0,n:"ISO/IEC 27037 · conduta",t:"Investigação interna tem limite",
   b:"Antes de encostar em qualquer equipamento: investigação interna não é apuração criminal, e o empregado não perde direitos. Trate só o necessário e registre a finalidade. Para identificação, coleta e preservação de evidência digital, a referência é a ISO/IEC 27037, e a regra de ouro é a ordem de volatilidade: o que se perde primeiro se coleta primeiro."},
  {at:2,n:"CPP arts. 158-A a 158-F",t:"Cadeia de custódia é lei, não boa prática",
   b:"E não é boa prática de mercado, é lei mesmo: a cadeia de custódia está positivada no Código de Processo Penal, arts. 158-A a 158-F, com as etapas de reconhecimento, isolamento, fixação, coleta, acondicionamento, transporte, recebimento, processamento, armazenamento e descarte. Lacuna em qualquer elo vira alegação de manipulação lá na frente."}],
 contratosoc:[
  {at:0,n:"Lei 14.133/2021",t:"Seu papel aqui é de fiscal",
   b:"Contexto antes de medir: a Lei 14.133/2021 estrutura a fiscalização do contrato, e o fiscal acompanha e registra em relatório, com as ocorrências e as providências. Uma coisa importante que confunde muita gente: glosa não é sanção. Glosa é pagar pelo que foi efetivamente entregue, conforme o IMR. Sanção é outro rito."},
  {at:2,n:"Lei 14.133 · conduta",t:"Sanção exige rito, e o fiscal não decide sozinho",
   b:"Se o caso caminhar para penalidade, ela depende de processo próprio, com contraditório e ampla defesa, e a decisão é da autoridade competente, não do fiscal. O que o fiscal faz é notificar formalmente, fixar prazo, documentar e comunicar o gestor do contrato. Vale lembrar também a divisão entre fiscal técnico e fiscal administrativo: regularidade fiscal e trabalhista não é assunto do técnico."}],
 soc:[
  {at:1,n:"ISO/IEC 27035",t:"Antes de você classificar essa fila",
   b:"Enquanto você tria, vou cuidando do lado formal aqui. A gestão de incidentes segue a ISO/IEC 27035, e a diferença entre evento e incidente importa: evento é qualquer ocorrência observável, incidente é o evento que compromete a segurança da informação. Só o incidente dispara o processo de resposta e as obrigações que vêm com ele."},
  {at:3,n:"LGPD art. 48",t:"Caixa postal comprometida acende a luz amarela",
   b:"Se a caixa de e-mail de alguém foi realmente acessada por terceiro, presuma que havia dado pessoal ali dentro e faça a avaliação de risco para o art. 48 da LGPD. O gatilho da comunicação é o risco ou dano relevante ao titular, e o prazo da ANPD é de 3 dias úteis do conhecimento. Documente a avaliação mesmo que a conclusão seja não comunicar."}],
 auditdr:[
  {at:1,n:"ISO 19011",t:"Achado de auditoria precisa de evidência",
   b:"Regra da casa, e da ISO 19011: achado é a comparação entre o critério e a evidência. Declaração de gestor não é evidência; registro assinado sem comprovante anexado também não. Se não dá pra reproduzir o teste, não vira achado, vira observação."},
  {at:4,n:"ISO 22301 · 27031 · CMN 4.893",t:"Continuidade tem norma e tem regulador",
   b:"Para o capítulo de continuidade: a ISO 22301 cuida do sistema de gestão de continuidade de negócios e a ISO/IEC 27031 da parte de TIC. RTO e RPO são definidos pelo negócio no BIA, e teste sem evidência do tempo real de retorno não comprova nada. Como somos cooperativa de crédito, ainda vale a Resolução CMN nº 4.893/2021, que exige política de segurança cibernética e plano de resposta e recuperação."}]
};


/* ============================================================
   PONTO SEM VOLTA — escolhas que encerram a crise na hora.
   FATAIS[caso][etapa][índice original da opção] = desfecho.
   Toda outra escolha ruim continua reversível: derruba medidor, mas a crise segue.
   ============================================================ */
const FATAIS={
 rotasul:{
  1:{2:{t:"O atacante venceu",
     b:"Entre 02:20 e o início do expediente, o ransomware terminou de criptografar o FS01, o ERP e o NAS01, que estava sempre online e no mesmo domínio. Os 4,1 GB continuaram saindo pela VPN maliciosa. Às 8h não havia mais o que conter: havia o que negociar. A transportadora parou por seis dias e os dados dos funcionários foram publicados."}},
  5:{2:{t:"Os dados se perderam de vez",
     b:"O descriptografador do fórum era do próprio grupo criminoso, empacotado com um segundo estágio. Religar o FS01 na rede reinfectou o ambiente e destruiu os arquivos que ainda estavam íntegros. A réplica limpa do DR foi alcançada na segunda onda. Não há mais ponto de restauração confiável."}}},
 clinica:{
  5:{3:{t:"A nota falsa virou o caso",
     b:"A clínica afirmou publicamente que nenhum dado foi acessado. Uma das funcionárias que digitou a senha mostrou o print do portal falso à imprensa. A nota, agora documentada, transformou um incidente tratável em declaração falsa ao público sobre dados sensíveis de saúde, com a ANPD instaurando processo e os pacientes indo à Justiça."}}},
 eta:{
  0:{3:{t:"A dosagem não esperou pelos logs",
     b:"O setpoint ficou em 9,5 mg/L por mais quarenta minutos enquanto os logs eram levantados. A água chegou à rede de distribuição fora do limite operacional, o hospital municipal registrou atendimentos e o abastecimento de 80 mil pessoas foi suspenso. Em ambiente industrial, a evidência se levanta depois; o processo físico se protege agora."}}},
 contrato:{
  3:{3:{t:"O laudo foi desmontado na audiência",
     b:"Você afirmou adulteração. O perito da outra parte apresentou os dois resumos SHA-256, idênticos, e a integridade ficou provada em minutos. Com a tese central derrubada, os pontos realmente frágeis, a data sem carimbo e o A1 na pasta compartilhada, nem chegaram a ser discutidos. O laudo foi desconsiderado."}}},
 netsul:{
  4:{2:{t:"Apagar registro é crime",
     b:"Os registros de conexão foram apagados depois de recebido um ofício que os solicitava. O Marco Civil obriga a guarda por um ano, e a exclusão após a solicitação caracterizou destruição de prova. A NetSul respondeu por isso, e a discussão sobre o que podia ou não ser entregue sem ordem judicial, em que a empresa tinha razão, deixou de existir."}}},
 pixel:{
  3:{2:{t:"A evidência apagada foi o fim",
     b:"O bucket e os logs de acesso foram apagados. Cópias do CSV já circulavam, e sem os logs a PixelKids não conseguiu dizer quem acessou, quando nem quantas crianças foram atingidas. O que era um incidente com dever de comunicar virou obstrução, com dados de 310 mil crianças expostos e nenhuma resposta possível aos responsáveis."}}},
 api:{
  3:{3:{t:"O endereço novo durou uma tarde",
     b:"Trocar a URL não corrigiu nem a injeção nem a falha de autorização. O atacante encontrou o novo endereço no Swagger, ainda habilitado em produção, e retomou a extração de onde havia parado. Os cadastros continuaram saindo por mais três dias, até a imprensa publicar. Esconder não é controle."}}},
 forense:{
  0:{3:{t:"A prova morreu no estacionamento",
     b:"O notebook saiu da empresa sem lacre, sem registro de transferência e ficou dois dias fora de qualquer custódia. A memória volátil se perdeu no caminho. Quando a análise começou, a defesa já tinha tudo de que precisava: não havia como provar que o equipamento examinado era o mesmo, no mesmo estado. A investigação interna caiu inteira."}},
  5:{1:{t:"A omissão foi descoberta",
     b:"Você omitiu do laudo a entrega sem registro ao T. Reis. A outra parte obteve o formulário de custódia completo e mostrou a lacuna em audiência. O problema deixou de ser a lacuna, que era contornável com a imagem íntegra, e passou a ser a sua credibilidade. O laudo foi anulado e a conduta, encaminhada para apuração."}}},
 contratosoc:{
  3:{2:{t:"A contratação por fora te alcançou",
     b:"Contratar outro fornecedor por conta própria, sem processo, dispensa fundamentada nem competência para isso, é contratação irregular. O contrato original seguiu vigente e sendo pago. O achado saiu no relatório do controle interno com o seu nome, e a fiscalização do SOC, que era o problema a resolver, nunca foi feita."}}},
 soc:{
  2:{2:{t:"O atacante teve mais sete horas",
     b:"A conta da Ana seguiu ativa das 01:50 às 09:00, com a regra de encaminhamento intacta. Nesse intervalo saíram os boletos do mês, um fornecedor pagou R$ 380 mil numa conta trocada e a mesma origem entrou em outras duas caixas. Quando a Ana chegou, não havia mais o que confirmar."}}},
 auditdr:{
  5:{1:{t:"Você mudou o critério, não o risco",
     b:"O RPO do documento foi alterado de 15 minutos para 4 horas e o achado desapareceu do relatório. Três meses depois, uma falha no site principal custou seis horas de transações da cooperativa. O documento alterado, com a sua assinatura, mostrou que a não conformidade era conhecida. Auditoria que ajusta o critério para caber na realidade deixa de ser auditoria."}}}
};

const MEDIDOR_ZERO={
 op:{t:"A operação não voltou",
  b:"As decisões foram se somando e a organização passou do ponto em que ainda conseguia trabalhar. Sistemas parados além do que o negócio aguenta deixam de ser um incidente de segurança e viram uma crise de sobrevivência: contratos rompidos, clientes atendidos na mão e a diretoria retirando o caso das suas mãos."},
 ct:{t:"O atacante nunca foi contido",
  b:"Enquanto a investigação seguia por caminhos que não fechavam portas, o acesso continuou aberto. O atacante manteve a presença, ampliou o alcance e levou o que quis. Quando a contenção enfim foi tentada, já não havia perímetro a defender: havia perda a contabilizar."},
 cf:{t:"O caso virou processo",
  b:"Prazos perdidos, comunicações que não saíram e registros que não foram preservados transformaram o incidente em descumprimento. O que chega agora não é mais o atacante: é o regulador, com pedido de explicação sobre decisões que ficaram todas documentadas."}
};
const MODES={dificil:{n:"Difícil",d:"3 tentativas por evidência, dicas custam pontos, medidores visíveis.",tries:3,hints:true,meters:true},
             pesadelo:{n:"Pesadelo",d:"2 tentativas, sem dicas e sem ver os medidores até a crise terminar.",tries:2,hints:false,meters:false}};
let C=null, R=null;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e;};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const clamp=v=>Math.max(0,Math.min(100,v));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

function show(id){
  ["list","game","end","inbox","lost"].forEach(s=>$(s).classList.toggle("hide",s!==id));
  window.scrollTo(0,0);
  if(id==="list") bitsAtualizar(); else bitsParar();
}

/* ============================================================ LISTA */
function renderList(){
  const m=$("modes"); m.innerHTML="";
  for(const [k,v] of Object.entries(MODES)){
    const b=el("button","mode"); b.setAttribute("aria-pressed",SAVE.mode===k);
    b.append(el("b",null,v.n), el("span",null,v.d));
    b.onclick=()=>{SAVE.mode=k;persist();renderList();};
    m.append(b);
  }
  $("cases").innerHTML=""; $("cases7").innerHTML="";
  $("ibBest").textContent = SAVE.best.inbox ? `Seu melhor resultado: ${SAVE.best.inbox}%` : "";
  CASES.forEach(c=>{ const g=$(c.grp==="e7"?"cases7":"cases");
    const d=el("article","case");
    d.append(el("span","lvl",c.lvl), el("h3",null,c.title), el("span","org",c.org), el("p",null,c.brief.split(". ").slice(0,2).join(". ")+"."));
    const t=el("div","tags"); c.tags.forEach(x=>t.append(el("span","tag",x))); d.append(t);
    const f=el("div","foot"), b=SAVE.best[c.id];
    f.append(el("span","best", b?`Melhor resultado: ${b}%`:"Ainda não jogado"));
    const go=el("button","btn sm","Assumir o caso"); go.onclick=()=>startCase(c.id); f.append(go);
    d.append(f); g.append(d);
  });
}

/* ============================================================ JOGO */
function startCase(id){
  C=CASES.find(c=>c.id===id);
  R={mode:MODES[SAVE.mode], step:0, m:{op:60,ct:60,cf:60}, pts:0, max:0, tries:0, hint:false, res:{}, marked:new Set(), reveal:new Set(), tab:C.ev[0].id, seen:new Set([C.ev[0].id]), shuf:{}, fxlog:[], how:false, chat:[], unread:0, falhas:0, snaps:{}, perdeu:null};
  C.steps.forEach((s,i)=>{
    if(s.type==="point") R.max+=20;
    if(s.type==="report") R.max+=10*s.fields.length;
    if(s.type==="decide") R.shuf[i]=shuffle(s.opts.map((o,j)=>j));
    if(s.type==="report") R.shuf[i]=s.fields.map(f=>shuffle(f.o.map((o,j)=>j)));
  });
  $("gTitle").innerHTML=""; $("gTitle").append(C.title, el("small",null,C.org+" · modo "+R.mode.n));
  R.snaps[0]=snapshot();
  show("game"); initChat(); render(); fireMentor(0);
}
function meters(){
  const L={op:"Operação",ct:"Contenção",cf:"Conformidade"};
  for(const k of ["op","ct","cf"]){
    const box=$("m"+k[0].toUpperCase()+k[1]); box.innerHTML="";
    const v=R.m[k], vis=R.mode.meters;
    const lb=el("div","lb"); lb.append(el("span",null,L[k]), el("span",null,vis?v:"?"));
    const tr=el("div","tr"), i=el("i"); i.style.width=(vis?v:50)+"%"; tr.append(i);
    box.classList.toggle("low",vis&&v<35); box.append(lb,tr);
  }
}
function unlocked(){return C.ev.filter(e=>e.at<=R.step);}
function curStep(){return C.steps[R.step];}
function isPointing(){const s=curStep(); return s&&s.type==="point"&&!R.res[R.step];}

function render(){ meters(); renderFeed(); renderEvid(); }

function renderEvid(){
  const ev=unlocked(), tabs=$("tabs"); tabs.innerHTML="";
  if(!ev.find(e=>e.id===R.tab)) R.tab=ev[0].id;
  ev.forEach(e=>{
    const b=el("button","tab",e.name); b.setAttribute("role","tab"); b.setAttribute("aria-selected",e.id===R.tab);
    if(!R.seen.has(e.id)) b.append(el("span","dot"));
    b.onclick=()=>{R.tab=e.id; R.seen.add(e.id); renderEvid();};
    tabs.append(b);
  });
  R.seen.add(R.tab);
  const p=isPointing(); $("evid").classList.toggle("pointing",p);
  $("evStatus").textContent = p ? "Clique na linha que prova" : "";
  const sh=$("sheet"); sh.innerHTML="";
  const doc=C.ev.find(e=>e.id===R.tab);
  doc.lines.forEach((t,i)=>{
    const key=doc.id+":"+i, ln=el("div","ln");
    if(R.marked.has(key)) ln.classList.add("marked");
    if(R.reveal.has(key)) ln.classList.add("reveal");
    ln.append(el("span","no",i+1), el("span","tx",t));
    if(p){ ln.tabIndex=0; ln.setAttribute("role","button"); ln.setAttribute("aria-label","Apontar linha "+(i+1)+": "+t);
      ln.onclick=()=>pick(key,ln); ln.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(key,ln);}}; }
    sh.append(ln);
  });
  renderHow();
}

function pick(key,ln){
  const s=curStep(); if(!isPointing()) return;
  if(s.ans.includes(key)){
    const table = R.mode.tries===3?[20,15,10]:[20,10];
    let p=table[R.tries]||0; if(R.hint) p=Math.max(0,p-5);
    R.pts+=p; R.marked.add(key); R.res[R.step]={ok:true,pts:p,key};
    render(); focusCur();
  } else {
    R.tries++; ln.classList.remove("miss"); void ln.offsetWidth; ln.classList.add("miss");
    if(R.tries>=R.mode.tries){
      s.ans.forEach(a=>R.reveal.add(a)); R.res[R.step]={ok:false,pts:0};
      R.falhas++; R.m.ct=clamp(R.m.ct-8);
      const d=C.ev.find(e=>e.id===s.ans[0].split(":")[0]); R.tab=d.id;
      const z=zerado();
      if(z) return perder({...MEDIDOR_ZERO[z], step:R.step});
      render(); focusCur();
    } else renderFeed();
  }
}

function evName(key){const [d,i]=key.split(":"); return C.ev.find(e=>e.id===d).name+", linha "+(+i+1);}

function renderFeed(){
  const f=$("feed"); f.innerHTML="";
  const b=el("div","brief"); b.append(el("p",null,C.brief)); f.append(b);
  for(let i=0;i<=R.step && i<C.steps.length;i++){
    const s=C.steps[i], done=!!R.res[i], cur=i===R.step;
    const card=el("div","step"+(cur?" cur":"")); card.id="st"+i;
    card.append(el("div","time",s.time));
    if(s.text) card.append(el("p","txt",s.text));
    if(s.q) card.append(el("p","q",s.q));

    if(s.type==="point"){
      if(!done){
        const h=el("div","pointing-hint");
        h.append(el("span","tries",`Tentativas: ${R.mode.tries-R.tries} de ${R.mode.tries}`));
        if(window.innerWidth<=900){ const g=el("button","btn sm ghost","Ir para as evidências"); g.onclick=()=>$("evid").scrollIntoView({behavior:reduce?"auto":"smooth"}); h.append(g); }
        if(R.mode.hints && s.hint){
          if(R.hint) h.append(el("span",null,"Dica: "+s.hint));
          else { const hb=el("button","link","Ver dica (−5 pontos)"); hb.onclick=()=>{R.hint=true;renderFeed();}; h.append(hb); }
        }
        card.append(h);
      } else {
        const r=R.res[i], w=el("div","why"+(r.ok?"":" bad"));
        w.append(el("b",null, r.ok?`Linha certa: ${evName(r.key)} (+${r.pts})`:`Tentativas esgotadas. A prova está em ${s.ans.map(evName).join(" ou ")}.`), document.createTextNode(s.why));
        card.append(w);
      }
    }

    if(s.type==="decide"){
      const res=R.res[i];
      if(!done){
        const o=el("div","opts");
        R.shuf[i].forEach(j=>{ const bt=el("button","opt",s.opts[j].t); bt.onclick=()=>decide(i,j); o.append(bt); });
        card.append(o);
      } else {
        const op=s.opts[res.j];
        card.append(el("p","done","Você decidiu: "+op.t));
        const out=el("div","out",op.out);
        if(R.mode.meters){ const fx=op.fx, parts=[]; const L={op:"Operação",ct:"Contenção",cf:"Conformidade"};
          for(const k in L) if(fx[k]) parts.push(`${L[k]} ${fx[k]>0?"+":""}${fx[k]}`);
          if(parts.length) out.append(el("div","fx",parts.join("   "))); }
        card.append(out);
      }
    }

    if(s.type==="report"){
      const res=R.res[i], box=el("div","fields");
      s.fields.forEach((fd,k)=>{
        const w=el("div","field"), id=`f${i}_${k}`, lab=el("label",null,fd.l); lab.htmlFor=id;
        const sel=el("select"); sel.id=id;
        sel.append(new Option("Escolha…",""));
        R.shuf[i][k].forEach(j=>sel.append(new Option(fd.o[j],j)));
        if(done){ sel.value=res.v[k]; sel.disabled=true; const ok=+res.v[k]===0; w.classList.add(ok?"r":"w");
          w.append(lab,sel); if(!ok) w.append(el("div","fix","Correto: "+fd.o[0])); }
        else { sel.onchange=()=>{ $("send"+i).disabled=[...box.querySelectorAll("select")].some(x=>x.value===""); }; w.append(lab,sel); }
        box.append(w);
      });
      card.append(box);
      if(!done){ const a=el("div","actions"), sb=el("button","btn","Enviar relatório"); sb.id="send"+i; sb.disabled=true;
        sb.onclick=()=>{ const v=[...box.querySelectorAll("select")].map(x=>x.value); let p=0; v.forEach(x=>{if(+x===0)p+=10;}); R.pts+=p; R.res[i]={v,pts:p}; renderFeed(); focusCur(); };
        a.append(sb); card.append(a); }
      else { const w=el("div","why"); w.append(el("b",null,`Relatório: ${res.pts/10} de ${s.fields.length} campos certos (+${res.pts})`), document.createTextNode(s.why)); card.append(w); }
    }

    if(cur && done){
      const nx=C.steps[i+1], newEv=C.ev.filter(e=>nx && e.at===i+1);
      const a=el("div","actions"), b2=el("button","btn", nx?"Continuar":"Encerrar a crise"); b2.id="cont";
      b2.onclick=advance; a.append(b2);
      if(newEv.length) a.append(el("span","tries","Nova evidência: "+newEv.map(e=>e.name).join(", ")));
      card.append(a);
    }
    f.append(card);
  }
}
function decide(i,j){
  const fx=C.steps[i].opts[j].fx;
  for(const k in fx) R.m[k]=clamp(R.m[k]+fx[k]);
  R.res[i]={j};
  const f=(FATAIS[C.id]||{})[i] && FATAIS[C.id][i][j];
  if(f) return perder({...f, step:i});
  const z=zerado();
  if(z) return perder({...MEDIDOR_ZERO[z], step:i});
  render(); focusCur();
}
function advance(){
  R.step++; R.tries=0; R.hint=false;
  if(R.step>=C.steps.length) return finish();
  const nw=C.ev.filter(e=>e.at===R.step); if(nw.length) R.tab=nw[0].id;
  R.snaps[R.step]=snapshot();
  render(); fireMentor(R.step);
  const c=$("st"+R.step); if(c) c.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
}
function focusCur(){ const b=$("cont"); if(b){ b.focus({preventScroll:true}); b.scrollIntoView({behavior:reduce?"auto":"smooth",block:"nearest"}); } }


/* ============================================================ COMO LER ESTA EVIDÊNCIA */
function renderHow(){
  const box=$("howBox"), btn=$("howBtn"); box.innerHTML="";
  btn.setAttribute("aria-expanded", R.how?"true":"false");
  if(!R.how) return;
  const doc=C.ev.find(e=>e.id===R.tab), g=HOWTO[R.tab];
  const w=el("div","howto");
  w.append(el("h4",null,"Como ler: "+doc.name));
  if(!g){ w.append(el("p",null,"Esta evidência não tem guia de leitura.")); box.append(w); return; }
  w.append(el("p",null,g.d));
  const dl=el("dl");
  g.c.forEach(([k,v])=>{ dl.append(el("dt",null,k), el("dd",null,v)); });
  w.append(dl); box.append(w);
}

/* ============================================================ COLEGA DE PLANTÃO */
let toastTimer=null;
function initChat(){
  $("chatWho").textContent=COLEGA.nome;
  $("chatRole").textContent=COLEGA.papel;
  $("chatAv").textContent=COLEGA.ini;
  closeChat(); killToast(); paintChat();
}
function fireMentor(step){
  const novas=(step===0?[INTRO]:[]).concat((MENTOR[C.id]||[]).filter(m=>m.at===step));
  if(!novas.length) return;
  novas.forEach(m=>R.chat.push(m));
  R.unread+=novas.length;
  paintChat();
  showToast(novas[0], novas.length);
}
function paintChat(){
  const b=$("chatCount");
  b.textContent=R.unread;
  b.classList.toggle("hide", R.unread===0);
  $("chatBtn").classList.toggle("pulsing", R.unread>0);
  $("chatBtn").setAttribute("aria-label", R.unread
    ? `Jurídico: ${R.unread} ${R.unread>1?"mensagens não lidas":"mensagem não lida"}`
    : "Jurídico: rever mensagens recebidas");
  const bd=$("chatBd"); bd.innerHTML="";
  if(!R.chat.length){
    bd.append(el("p","chat-empty","Nada por aqui ainda. O jurídico escreve sozinho quando o caso encostar em lei, norma ou conduta."));
    return;
  }
  R.chat.forEach(m=>{
    const c=el("div","cmsg");
    c.append(el("div","ct", C.steps[m.at] ? C.steps[m.at].time : ""));
    c.append(el("b",null,m.t));
    c.append(el("p",null,m.b));
    if(m.n) c.append(el("span","tagn",m.n));
    bd.append(c);
  });
}
function openChat(){
  $("chatPop").classList.remove("hide");
  $("chatBtn").setAttribute("aria-expanded","true");
  R.unread=0; killToast(); paintChat();
  const p=$("chatPop"), ult=$("chatBd").lastElementChild, hd=p.querySelector(".chatpop-hd");
  if(ult) p.scrollTop=Math.max(0, ult.offsetTop-hd.offsetHeight-10);
  $("chatX").focus({preventScroll:true});
}
function closeChat(){
  $("chatPop").classList.add("hide");
  $("chatBtn").setAttribute("aria-expanded","false");
}
function showToast(m,qtd){
  killToast();
  const t=el("button","toast"); t.id="toast";
  const th=el("div","th"); th.append(el("i"), el("span",null,"Jurídico e Compliance"));
  t.append(th, el("b",null,m.t),
    el("span",null, qtd>1 ? `e mais ${qtd-1}. Toque para ler` : "Toque para ler"));
  t.onclick=e=>{ e.stopPropagation(); killToast(); openChat(); };
  document.body.append(t);
  toastTimer=setTimeout(killToast, 12000);
}
function killToast(){
  const t=$("toast"); if(t) t.remove();
  if(toastTimer){ clearTimeout(toastTimer); toastTimer=null; }
}
function leaveCase(){ killToast(); closeChat(); }

/* ============================================================ DERROTA */
function snapshot(){
  return {m:{...R.m}, pts:R.pts, tries:R.tries, hint:R.hint,
    res:JSON.parse(JSON.stringify(R.res)),
    marked:[...R.marked], reveal:[...R.reveal], seen:[...R.seen],
    tab:R.tab, chat:[...R.chat], unread:R.unread, falhas:R.falhas};
}
function restore(s){
  R.m={...s.m}; R.pts=s.pts; R.tries=0; R.hint=false;
  R.res=JSON.parse(JSON.stringify(s.res));
  R.marked=new Set(s.marked); R.reveal=new Set(s.reveal); R.seen=new Set(s.seen);
  R.tab=s.tab; R.chat=[...s.chat]; R.unread=s.unread; R.falhas=s.falhas;
}
function zerado(){ return ["op","ct","cf"].find(k=>R.m[k]<=0); }

function perder(motivo){
  R.perdeu=motivo;
  leaveCase();
  const MED={op:"Operação",ct:"Contenção",cf:"Conformidade"};
  $("lCase").textContent=C.title+" · modo "+R.mode.n;
  $("lTitle").textContent=motivo.t;
  $("lStory").textContent=motivo.b;

  /* o que deveria ter sido feito */
  const dif=$("lDiff"); dif.innerHTML="";
  const erradas=C.steps.map((s,i)=>({s,i}))
    .filter(x=>x.s.type==="decide" && R.res[x.i] && R.res[x.i].j!==0);
  if(motivo.step!=null && !erradas.some(x=>x.i===motivo.step) && C.steps[motivo.step].type==="decide")
    erradas.push({s:C.steps[motivo.step], i:motivo.step});
  erradas.sort((a,b)=>a.i-b.i);
  if(!erradas.length){
    dif.append(el("p","ldiff-none","Nenhuma decisão isolada explica o desfecho: os medidores foram cedendo ao longo da investigação."));
  }
  erradas.forEach(({s,i})=>{
    const fatal = motivo.step===i;
    const d=el("div","ldiff"+(fatal?" fatal":""));
    d.append(el("div","time",s.time+" · "+s.q));
    if(fatal) d.append(el("span","lbadge","ponto sem volta"));
    d.append(el("p","you","Você escolheu: "+s.opts[R.res[i].j].t));
    d.append(el("p","fix","O que deveria ter sido feito: "+s.opts[0].t));
    d.append(el("p",null,s.why));
    dif.append(d);
  });

  /* estado dos medidores */
  const nums=$("lNums"); nums.innerHTML="";
  ["op","ct","cf"].forEach(k=>{
    const d=el("div","num"+(R.m[k]<=0?" zero":""));
    d.append(el("b",null,R.m[k]), el("span",null,MED[k]));
    nums.append(d);
  });
  if(R.falhas) nums.append((()=>{const d=el("div","num");
    d.append(el("b",null,R.falhas), el("span",null,R.falhas>1?"evidências não identificadas":"evidência não identificada")); return d;})());

  /* voltar ao ponto de virada */
  const volta=$("lBack");
  const snap=R.snaps[motivo.step];
  volta.classList.toggle("hide", motivo.step==null || !snap);
  if(snap) volta.textContent = C.steps[motivo.step].type==="decide"
    ? "Voltar e decidir de novo" : "Voltar ao ponto de virada";
  show("lost");
}
function voltarPontoVirada(){
  const i=R.perdeu.step, snap=R.snaps[i];
  if(snap==null) return;
  restore(snap); delete R.res[i]; R.step=i; R.perdeu=null;
  show("game"); render();
  const c=$("st"+i); if(c) c.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
}

/* ============================================================
   FUNDO DA TELA INICIAL — 0 e 1 subindo.
   Vermelho quando nada foi resolvido, azul conforme os casos encerram.
   ============================================================ */
const BITS={cv:null,ctx:null,cols:[],w:0,h:0,raf:0,passo:11,linha:15,prog:0};
function bitsProgresso(){
  const tot=CASES.length;
  const feitos=CASES.filter(c=>SAVE.best[c.id]!=null).length;
  return {feitos,tot,p:tot?feitos/tot:0};
}
function bitsCor(p,a){
  const r=Math.round(229+(47-229)*p), g=Math.round(52+(111-52)*p), b=Math.round(42+(224-42)*p);
  return `rgba(${r},${g},${b},${a})`;
}
function bitsMedir(){
  const cv=BITS.cv;
  const w=cv.clientWidth||window.innerWidth, h=cv.clientHeight||window.innerHeight;
  const dpr=Math.min(window.devicePixelRatio||1, 2);
  BITS.w=w; BITS.h=h;
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  BITS.ctx.setTransform(dpr,0,0,dpr,0,0);
  BITS.ctx.font='600 13px ui-monospace, "IBM Plex Mono", Consolas, monospace';
  BITS.ctx.textBaseline="top";
  const n=Math.max(1,Math.ceil(w/BITS.passo));
  BITS.cols=Array.from({length:n},(_,i)=>novaColuna(i,h,true));
}
function novaColuna(i,h,inicial){
  const len=7+Math.floor(Math.random()*14);
  return {
    x:i*BITS.passo+3,
    y: inicial ? Math.random()*(h+400) : h+40+Math.random()*260,
    v:.30+Math.random()*1.05,
    len,
    a:.16+Math.random()*.34,
    ch:Array.from({length:len},()=>Math.random()<.5?"0":"1"),
    t:0
  };
}
function bitsQuadro(){
  const c=BITS.ctx, {w,h,prog}=BITS, L=BITS.linha;
  c.fillStyle="#05070A"; c.fillRect(0,0,w,h);
  for(let i=0;i<BITS.cols.length;i++){
    const col=BITS.cols[i];
    col.y-=col.v;
    if(++col.t%7===0) col.ch[Math.floor(Math.random()*col.len)]=Math.random()<.5?"0":"1";
    if(col.y+col.len*L<-10){ BITS.cols[i]=novaColuna(i,h,false); continue; }
    for(let k=0;k<col.len;k++){
      const y=col.y+k*L;
      if(y<-L||y>h) continue;
      const fade=1-k/col.len;
      c.fillStyle = k===0 ? bitsCor(prog,Math.min(.95,col.a+.55)) : bitsCor(prog,col.a*fade);
      c.fillText(col.ch[k], col.x, y);
    }
  }
  BITS.raf=requestAnimationFrame(bitsQuadro);
}
function bitsIniciar(){
  BITS.cv=$("bits"); if(!BITS.cv) return;
  BITS.ctx=BITS.cv.getContext("2d");
  let tmr=null;
  addEventListener("resize",()=>{
    if($("list").classList.contains("hide")) return;
    clearTimeout(tmr); tmr=setTimeout(()=>{ bitsMedir(); if(reduce) bitsQuadroEstatico(); },150);
  });
}
function bitsAtualizar(){
  if(!BITS.cv) bitsIniciar();
  if(!BITS.ctx) return;
  const {feitos,tot,p}=bitsProgresso();
  BITS.prog=p;
  const pr=$("prog");
  if(pr) pr.innerHTML = feitos===0
    ? "Nenhum caso encerrado ainda."
    : `<b>${feitos}</b> de ${tot} casos encerrados.` + (feitos===tot?" Sala limpa.":"");
  bitsMedir();
  bitsParar();
  if(reduce){ bitsQuadroEstatico(); return; }
  BITS.raf=requestAnimationFrame(bitsQuadro);
}
function bitsQuadroEstatico(){
  const c=BITS.ctx, {w,h,prog}=BITS, L=BITS.linha;
  c.fillStyle="#05070A"; c.fillRect(0,0,w,h);
  for(const col of BITS.cols)
    for(let k=0;k<col.len;k++){
      const y=col.y+k*L; if(y<-L||y>h) continue;
      c.fillStyle=bitsCor(prog,col.a*(1-k/col.len)*.9);
      c.fillText(col.ch[k], col.x, y);
    }
}
function bitsParar(){ if(BITS.raf){ cancelAnimationFrame(BITS.raf); BITS.raf=0; } }

/* ============================================================ FIM */
function finish(){
  const inv=Math.round(100*R.pts/R.max), avg=Math.round((R.m.op+R.m.ct+R.m.cf)/3), fin=Math.round(inv*.5+avg*.5);
  const dec=C.steps.map((s,i)=>({s,i})).filter(x=>x.s.type==="decide"), bestN=dec.filter(x=>R.res[x.i].j===0).length;
  $("eCase").textContent=C.title+" · modo "+R.mode.n;
  $("eVerdict").textContent = fin>=80?"Crise controlada.": fin>=62?"Controlada, com danos.": fin>=45?"Danos sérios.":"Fora de controle.";
  const nums=$("eNums"); nums.innerHTML="";
  [[fin+"%","resultado final"],[inv+"%","investigação ("+R.pts+"/"+R.max+" pts)"],[bestN+" de "+dec.length,"melhores decisões"],[R.m.op,"operação"],[R.m.ct,"contenção"],[R.m.cf,"conformidade"]]
    .forEach(([b,s])=>{const d=el("div","num"); d.append(el("b",null,b),el("span",null,s)); nums.append(d);});
  const deb=$("eDeb"); deb.innerHTML="";
  dec.forEach(({s,i})=>{
    const j=R.res[i].j, ok=j===0, d=el("div","deb "+(ok?"okk":"nok"));
    d.append(el("div","time",s.time+" · "+s.q));
    d.append(el("p","you","Você: "+s.opts[j].t));
    if(!ok) d.append(el("p",null,"Melhor escolha: "+s.opts[0].t));
    d.append(el("p",null,s.why));
    deb.append(d);
  });
  SAVE.best[C.id]=Math.max(SAVE.best[C.id]||0,fin); persist();
  leaveCase(); show("end");
}

/* ============================================================
   GOLPE OU NÃO? — mensagens (todas as marcas, pessoas e números são fictícios)
   segmento: "texto" (neutro) | {t, f} | {link, url, f} | {qr:true, url, f}
   ============================================================ */
const ATLAS="Você trabalha no Grupo Atlas. O domínio oficial da empresa é grupoatlas.com.br.";
const MSGS=[
{ch:"sms",from:{name:"+55 11 97342-1180",f:"num"},ctx:"Você está esperando uma compra online.",
 msgs:[{time:"14:32",b:["CorreioJá: sua encomenda BR88214 está ",{t:"retida por falta de pagamento de taxa",f:"taxa"},". ",{t:"Regularize até hoje às 23h59",f:"urg"}," ou ela será devolvida: ",{link:"correioja-taxa.com/r/88214",url:"http://correioja-taxa.com/r/88214",f:"dom"}]}],
 v:"golpe",tech:"Smishing (phishing por SMS)",
 flags:{num:"Número de celular comum como remetente. Empresas costumam usar números curtos ou remetente identificado.",taxa:"Cobrança inesperada, geralmente pequena, para você pagar sem pensar.",urg:"Prazo curtíssimo para impedir que você confira.",dom:"Não é o site oficial: o nome da empresa colado a 'taxa' num domínio qualquer é padrão de golpe."},
 act:"Não clique. Consulte o rastreio pelo app ou digitando você mesmo o endereço oficial. Denuncie o número como spam."},

{ch:"whats",from:{name:"+55 21 99614-3307",note:"Não está nos seus contatos",f:"num"},ctx:"Você é mãe do Lucas, 24 anos.",
 msgs:[
  {time:"09:12",b:["Oi mãe, ",{t:"esse é meu número novo, o outro caiu na água e parou",f:"novo"}]},
  {time:"09:12",b:["Salva aí 😘"]},
  {me:true,time:"09:20",b:["Oi filho! Tá tudo bem?"]},
  {time:"09:21",b:["Tô sim. Mãe, ",{t:"preciso pagar um boleto hoje e o app do banco não abre no celular novo",f:"desc"},". ",{t:"Consegue me fazer um Pix de R$ 1.850 agora?",f:"pix"}," Amanhã te devolvo"]},
  {time:"09:22",b:["Chave 219.845.330-71 ",{t:"(é da Rosana, a moça da contabilidade)",f:"terc"}]},
  {me:true,time:"09:23",b:["Te ligo rapidinho"]},
  {time:"09:23",b:[{t:"Não dá pra atender agora, tô em reunião. Faz aí que é urgente",f:"lig"}]}],
 v:"golpe",tech:"Golpe do falso parente (pretexting por WhatsApp)",
 flags:{num:"Número desconhecido se apresentando como alguém próximo.",novo:"'Número novo' é a desculpa para você não estranhar o contato.",desc:"Justificativa pronta para ele não conseguir pagar sozinho.",pix:"Pedido de dinheiro logo nas primeiras mensagens.",terc:"O Pix vai para um terceiro, não para o próprio filho.",lig:"Recusa em falar por voz: a voz entregaria o golpe."},
 act:"Ligue para o número antigo ou para alguém próximo, ou faça uma pergunta que só ele saberia responder. Nunca transfira para terceiros só com base em mensagem."},

{ch:"email",ctx:ATLAS+" Você é analista do financeiro.",
 from:{name:"Ricardo Almeida",addr:"ricardo.almeida@grupo-atlas.co",f:"dom"},to:"marina.costa@grupoatlas.com.br",subject:"Confidencial - pagamento hoje",time:"qui 15:47",
 headers:["Return-Path: <ricardo.almeida@grupo-atlas.co>",{t:"Reply-To: ricardo.almeida.dir@gmail.com",f:"reply"},"Authentication-Results: spf=pass dkim=pass dmarc=pass (domínio grupo-atlas.co)","Received: from mail.grupo-atlas.co"],
 body:[["Olá, Marina,"],[{t:"Estou em reunião com o conselho e não consigo atender ligações.",f:"indisp"}," Precisamos fechar hoje uma aquisição e o fornecedor exige um sinal."],[{t:"Efetue ainda hoje uma TED de R$ 184.500,00",f:"valor"}," para a conta abaixo. ",{t:"A operação é confidencial: não comente com ninguém da equipe, nem com o controller.",f:"sigilo"}],["Banco 341 · Ag 0921 · CC 44810-2 · Vertix Consultoria Ltda."],["Me confirme por aqui quando concluir."],["Ricardo Almeida · Diretor Financeiro"]],
 v:"golpe",tech:"BEC / fraude do CEO (spear phishing contra executivos e financeiro)",
 flags:{dom:"O domínio é grupo-atlas.co, não grupoatlas.com.br: hífen a mais e terminação diferente.",reply:"As respostas iriam para um Gmail pessoal.",indisp:"Ficar inacessível impede você de confirmar por telefone.",valor:"Valor alto, fora do processo normal, para hoje.",sigilo:"Pedir segredo para você não consultar o controller é a marca da fraude do CEO."},
 note:"Repare: SPF, DKIM e DMARC passaram. Isso só prova que o e-mail veio mesmo do domínio grupo-atlas.co, que é do golpista. Autenticação não diz se o domínio é legítimo.",
 act:"Confirme por um canal independente (telefone já cadastrado, pessoalmente) e siga a aprovação dupla. Encaminhe ao time de segurança."},

{ch:"email",ctx:ATLAS,
 from:{name:"Service Desk Grupo Atlas",addr:"servicedesk@grupoatlas.com.br"},to:"marina.costa@grupoatlas.com.br",subject:"Manutenção programada no sábado (27/09), das 22h às 2h",time:"ter 10:05",
 headers:["Return-Path: <servicedesk@grupoatlas.com.br>","Authentication-Results: spf=pass dkim=pass dmarc=pass (grupoatlas.com.br)","Received: from mx1.grupoatlas.com.br"],
 body:[["Olá, equipe."],["No sábado, 27/09, entre 22h e 2h, o e-mail e a VPN podem ficar indisponíveis por alguns minutos para atualização de segurança."],["Não é necessária nenhuma ação da sua parte."],["Lembrete: o Service Desk nunca pede sua senha, seja por e-mail, telefone ou mensagem."],["Dúvidas: ramal 4000."]],
 v:"legit",tech:"Comunicado legítimo",flags:{},
 act:"Nada a fazer. Sinais de legitimidade: domínio correto, autenticação passando para ele, nenhum pedido de ação, senha ou pagamento, e um canal conhecido para dúvidas."},

{ch:"sms",from:{name:"28500"},ctx:"Você acabou de tocar em 'Entrar' no app do seu banco, no seu celular.",
 msgs:[{time:"19:04",b:["Banco Horizonte: seu código de acesso é 482913. ","Não compartilhe este código com ninguém, nem com funcionários do banco."]}],
 v:"legit",tech:"Mensagem legítima (código que você mesmo pediu)",flags:{},
 act:"Use o código no app que você abriu. Se o mesmo SMS chegasse sem você ter pedido, alguém teria sua senha: não repasse e troque a senha."},

{ch:"whats",from:{name:"Mercado Bom Preço",note:"Conta comercial não verificada · +55 11 96120-8841",f:"num"},ctx:"Você é cliente eventual do mercado.",
 msgs:[
  {time:"11:02",b:["Olá! 🎉 ",{t:"Parabéns, seu número foi sorteado na promoção de aniversário do Mercado Bom Preço",f:"premio"},"! Você ganhou um vale-compras de R$ 500."]},
  {time:"11:02",b:["Para liberar, ",{t:"vou te enviar um código de 6 dígitos por SMS. É só me mandar aqui",f:"codigo"}," para confirmar o cadastro."]},
  {time:"11:03",b:[{t:"O prêmio expira em 10 minutos ⏳",f:"urg"}]}],
 v:"golpe",tech:"Engenharia social para sequestro de conta do WhatsApp",
 flags:{num:"Conta comercial não verificada, com número de celular comum.",premio:"Sorteio de algo em que você nem se inscreveu.",codigo:"O código de 6 dígitos que chega por SMS é o de registro do WhatsApp no celular do golpista. Com ele, ele assume sua conta e pede dinheiro aos seus contatos.",urg:"Pressão de tempo."},
 act:"Nunca repasse códigos recebidos por SMS. Ative a verificação em duas etapas do WhatsApp (PIN) e denuncie o contato."},

{ch:"email",ctx:ATLAS,
 from:{name:"Suporte TI",addr:"no-reply@mail-grupoatlas.com",f:"dom"},to:"marina.costa@grupoatlas.com.br",subject:{t:"[AÇÃO NECESSÁRIA] Sua caixa de e-mail atingiu 99%",f:"urg"},time:"seg 08:12",
 headers:["Return-Path: <bounce@srv-mailer22.net>",{t:"Authentication-Results: spf=fail (mail-grupoatlas.com) dkim=none dmarc=fail",f:"auth"},"Received: from srv-mailer22.net (45.61.x.x)"],
 body:[[{t:"Prezado usuário,",f:"gen"}],["Sua caixa de correio atingiu o limite de armazenamento. ",{t:"Se não liberar espaço em 24 horas, sua conta será desativada e as mensagens excluídas.",f:"urg"}],[{link:"Liberar espaço agora",url:"https://grupoatlas.com.br.portal-login.info/owa/auth",f:"link"}],["Equipe de Suporte"]],
 v:"golpe",tech:"Phishing de credenciais",
 flags:{dom:"mail-grupoatlas.com não é o domínio oficial.",gen:"Saudação genérica: a TI da sua empresa sabe seu nome.",urg:"Ameaça de perda e prazo curto.",link:"O domínio real é portal-login.info. 'grupoatlas.com.br.' no começo é só um subdomínio para enganar. Cadeado HTTPS não diz quem é o dono do site.",auth:"SPF e DMARC falharam: o servidor que enviou não está autorizado pelo domínio."},
 act:"Não clique. Reporte pelo botão de phishing ou ao time de segurança. Se já digitou a senha, troque-a e avise o SOC."},

{ch:"email",ctx:"Você é fiscal administrativa do contrato com a Técnica Redes Ltda. (tecnicaredes.com.br), que envia a nota fiscal todo mês por e-mail.",
 from:{name:"Financeiro Técnica Redes",addr:"financeiro@tecnicaredes.com.br"},to:"fiscal.contratos@orgao.gov.br",subject:"RE: NF 3321 - setembro",time:"qua 16:20",
 headers:["Return-Path: <financeiro@tecnicaredes.com.br>","Authentication-Results: spf=pass dkim=pass dmarc=pass (tecnicaredes.com.br)","Received: from mx.tecnicaredes.com.br"],
 body:[["Boa tarde! Segue a NF 3321, referente a setembro."],[{t:"Informamos que atualizamos nossos dados bancários.",f:"mud"}," ",{t:"Favor desconsiderar o boleto anterior e pagar pelo novo boleto em anexo.",f:"novo"}],[{t:"O novo beneficiário é TR Serviços e Cobranças Ltda., nossa parceira de recebíveis.",f:"benef"}],[{t:"Pedimos pagamento até amanhã para evitar juros e bloqueio do atendimento.",f:"urg"}],["Att., Luciana · Financeiro"]],
 att:[{name:"boleto_NF3321_atualizado.pdf"}],
 v:"golpe",tech:"Fraude de boleto por e-mail do fornecedor invadido (BEC)",
 flags:{mud:"Troca de dados bancários comunicada por e-mail é o principal sinal dessa fraude.",novo:"Pedido para ignorar o boleto anterior.",benef:"O beneficiário não é a contratada. Em contrato público, o pagamento vai para a conta da contratada.",urg:"Pressão com juros e bloqueio."},
 note:"Aqui o remetente é o verdadeiro e tudo passou na autenticação: a caixa de e-mail do fornecedor foi invadida. O sinal está no pedido, não no remetente.",
 act:"Não pague. Confirme pelo telefone já cadastrado no contrato, nunca o da assinatura do e-mail. Mudança de conta exige pedido formal. Avise o fornecedor de que a caixa dele pode estar invadida."},

{ch:"sms",from:{name:"+55 48 99108-7730",f:"num"},ctx:"Você tem cartão do Banco Horizonte e não fez compras hoje.",
 msgs:[{time:"22:47",b:["Banco Horizonte: ",{t:"compra de R$ 4.379,00 APROVADA em ELETRO SHOP",f:"alarme"},". ",{t:"Nao reconhece? Ligue agora 0800 591 2044",f:"fone"}]}],
 v:"golpe",tech:"Smishing que leva a vishing (falsa central telefônica)",
 flags:{num:"Número de celular comum se passando pelo banco.",alarme:"Valor alto para assustar e fazer você agir sem pensar.",fone:"O número é do golpista. A 'central' pede dados, senha ou uma transferência 'de segurança'. Sem link, a mensagem passa pelos filtros."},
 act:"Ligue para o número atrás do cartão ou use o app. Banco não pede senha nem transferência para 'proteger' a conta."},

{ch:"email",ctx:ATLAS,
 from:{name:"Gente & Gestão – Grupo Atlas",addr:"rh@grupoatlas.com.br"},to:"marina.costa@grupoatlas.com.br",subject:"Holerite de setembro disponível",time:"sex 09:00",
 headers:["Return-Path: <rh@grupoatlas.com.br>","Authentication-Results: spf=pass dkim=pass dmarc=pass (grupoatlas.com.br)","Received: from mx2.grupoatlas.com.br"],
 body:[["Olá, Marina."],["Seu holerite de setembro já está disponível no portal do colaborador."],["Acesse como de costume: ",{link:"rh.grupoatlas.com.br",url:"https://rh.grupoatlas.com.br/holerites"}," (login com sua conta corporativa e MFA)."],["Dúvidas: ramal 4100."]],
 v:"legit",tech:"Comunicado legítimo",flags:{},
 act:"Pode acessar. Por hábito seguro, você também pode digitar o endereço. Domínio correto no remetente e no link, nada fora do comum, sem urgência."},

{ch:"whats",from:{name:"+55 11 93318-2210",note:"Não está nos seus contatos",f:"num"},ctx:"02:13 da madrugada. Seu celular recebeu 6 notificações seguidas do app autenticador: 'Aprovar entrada? Local: Lagos, Nigéria'. Logo depois chega esta mensagem.",
 msgs:[
  {time:"02:15",b:["Oi, aqui é o ",{t:"Diego, do Suporte TI",f:"pretx"},". ",{t:"Estamos fazendo manutenção no sistema de login e as notificações são parte do teste",f:"desc"},"."]},
  {time:"02:15",b:[{t:"Pode aprovar a próxima, por favor? Senão sua conta fica bloqueada amanhã",f:"aprov"}]}],
 v:"golpe",tech:"Fadiga de MFA (push bombing) com pretexting",
 flags:{num:"Número desconhecido, de madrugada.",pretx:"Se apresenta como TI sem nenhuma forma de você confirmar.",desc:"Explicação inventada para os pedidos que você não fez.",aprov:"Pedir que você aprove um MFA é o objetivo do ataque: o atacante já tem sua senha."},
 act:"Negue tudo, não aprove nada, troque sua senha e avise o SOC pelo canal oficial. Pedidos de MFA que você não iniciou significam senha comprometida."},

{ch:"email",ctx:ATLAS,
 from:{name:"Benefícios Grupo Atlas",addr:"beneficios@atlas-beneficios.com.br",f:"dom"},to:"marina.costa@grupoatlas.com.br",subject:"Atualização obrigatória do cartão alimentação",time:"qua 11:30",
 headers:["Return-Path: <beneficios@atlas-beneficios.com.br>","Authentication-Results: spf=pass dkim=pass dmarc=pass (atlas-beneficios.com.br)","Received: from mail.atlas-beneficios.com.br"],
 body:[["Olá, colaborador(a)."],["Para continuar recebendo o crédito de outubro, ",{t:"atualize seus dados até sexta-feira",f:"urg"},"."],[{qr:true,url:"https://atlas-beneficios.app/login?c=77",f:"qr"}],["Aponte a câmera do celular para o código e ",{t:"entre com seu usuário e senha da rede",f:"cred"},"."]],
 v:"golpe",tech:"Quishing (phishing por QR code)",
 flags:{dom:"Domínio externo que imita a empresa; não é grupoatlas.com.br.",urg:"Prazo e ameaça de perder o benefício.",qr:"QR code tira o link do alcance dos filtros de e-mail e leva você para o celular, geralmente menos protegido. O destino é atlas-beneficios.app.",cred:"Cartão alimentação não precisa da sua senha de rede."},
 act:"Não escaneie. Confirme com o RH pelo canal interno e reporte a mensagem."},

{ch:"whats",from:{name:"+55 11 94420-1187",note:"Não está nos seus contatos",f:"num"},ctx:ATLAS,
 msgs:[
  {time:"10:05",b:["Bom dia! ",{t:"Aqui é o Diego do suporte técnico do Grupo Atlas",f:"pretx"}]},
  {time:"10:05",b:[{t:"Nosso antivírus detectou um vírus no seu computador e ele pode se espalhar pela rede",f:"medo"}]},
  {time:"10:06",b:["Para eu resolver, ",{t:"instala o AnyDesk e me passa o código de acesso que aparecer",f:"remoto"},": ",{link:"anydesk-suporte.com/download",url:"http://anydesk-suporte.com/download",f:"link"}]},
  {time:"10:06",b:[{t:"É rapidinho, resolvo antes do seu chefe ficar sabendo",f:"urg"}]}],
 v:"golpe",tech:"Falso suporte técnico (pretexting / quid pro quo)",
 flags:{num:"Suporte da empresa falando por número pessoal desconhecido.",pretx:"Identidade alegada, sem como confirmar.",medo:"Medo como gatilho.",remoto:"Instalar acesso remoto e passar o código entrega o controle do seu computador.",link:"Site que não é do fabricante nem da empresa.",urg:"Pressa e sigilo em relação ao chefe."},
 act:"Encerre a conversa e ligue para o Service Desk pelo ramal oficial. Suporte legítimo usa ferramentas corporativas, não pede instalação por link de WhatsApp."},

{ch:"whats",from:{name:"+44 7700 900412",note:"Não está nos seus contatos",f:"num"},ctx:"Você publicou no LinkedIn que está procurando emprego.",
 msgs:[
  {time:"15:40",b:["Olá! Sou a Camila, ",{t:"recrutadora da agência Digital Growth",f:"recr"},". Vi seu perfil e temos uma vaga home office."]},
  {time:"15:41",b:[{t:"Você ganha de R$ 150 a R$ 400 por dia só curtindo vídeos e avaliando lojas",f:"facil"}]},
  {time:"15:52",b:["Já fiz um teste: ",{t:"te mandei R$ 20 pelo Pix pra mostrar que é real",f:"isca"}," 😊"]},
  {time:"15:53",b:["Para liberar as tarefas premium e sacar, ",{t:"é só fazer um depósito de R$ 250 na plataforma",f:"deposito"}]}],
 v:"golpe",tech:"Golpe de tarefas (fraude de adiantamento)",
 flags:{num:"Número estrangeiro desconhecido.",recr:"Empresa genérica, sem processo seletivo.",facil:"Ganho alto por tarefa trivial.",isca:"Pagar um valor pequeno primeiro cria confiança para o pedido maior.",deposito:"Emprego legítimo não cobra para você trabalhar."},
 act:"Não deposite nada. Bloqueie e denuncie. Se já pagou, registre boletim de ocorrência e acione seu banco."},

{ch:"email",ctx:"Você não estava esperando nenhum Pix.",
 from:{name:"Pagamentos",addr:"comprovantes@pix-confirmacao.net",f:"dom"},to:"marina.costa@grupoatlas.com.br",subject:{t:"Comprovante de Pix recebido: R$ 7.850,00",f:"curio"},time:"ter 18:02",
 headers:["Return-Path: <x7@bulk-mail.top>",{t:"Authentication-Results: spf=softfail dkim=none dmarc=none",f:"auth"},"Received: from unknown (103.x.x.x)"],
 body:[[{t:"Olá,",f:"gen"}],["Segue em anexo o comprovante da transferência realizada para você."],[{t:"Abra o arquivo no computador para visualizar.",f:"abra"}]],
 att:[{name:"Comprovante_Pix_27091.html",f:"att"}],
 v:"golpe",tech:"Phishing com anexo HTML",
 flags:{dom:"Remetente genérico, sem relação com nenhum banco.",curio:"Dinheiro inesperado desperta curiosidade.",gen:"Nenhuma identificação de quem pagou ou recebeu.",abra:"Insiste em abrir no computador, onde a página maliciosa funciona melhor.",att:"Anexo .html abre uma página local que costuma imitar um login e enviar sua senha ao atacante. Comprovante verdadeiro aparece no app do banco.",auth:"Autenticação fraca: softfail, sem DKIM nem DMARC."},
 act:"Não abra o anexo. Confira no app do banco se algo entrou. Reporte a mensagem."},

{ch:"sms",from:{name:"3030"},ctx:"Você é cliente da Conecta Móvel, com plano de R$ 89,90.",
 msgs:[{time:"08:30",b:["Conecta Móvel: sua fatura de setembro, de R$ 89,90, vence em 10/10. ","Consulte e pague pelo app oficial. Não enviamos links por SMS."]}],
 v:"legit",tech:"Mensagem legítima",flags:{},
 act:"Nada suspeito: número curto conhecido, valor compatível com seu plano e orientação para usar o app oficial em vez de link."}
];

/* ============================================================ INBOX */
let IB=null;
function qrSVG(seed){
  const n=21,c=[]; let s=seed;
  const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
  const finder=(x,y)=>{for(let i=0;i<7;i++)for(let j=0;j<7;j++){const on=i===0||j===0||i===6||j===6||(i>1&&i<5&&j>1&&j<5); if(on)c.push([x+i,y+j]);}};
  finder(0,0);finder(14,0);finder(0,14);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const inF=(i<8&&j<8)||(i>12&&j<8)||(i<8&&j>12); if(!inF&&rnd()>.52)c.push([i,j]);}
  return `<svg viewBox="-1 -1 23 23" width="132" height="132" aria-label="QR code"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>${c.map(([x,y])=>`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="#111"/>`).join("")}</svg>`;
}
function startInbox(all){
  const list=shuffle(MSGS.map((m,i)=>i));
  IB={deck:all?list:list.slice(0,8), i:0, score:0, max:0, right:0, found:0, flagsTotal:0, wrong:0};
  show("inbox"); renderMsg();
}
function renderMsg(){
  const m=MSGS[IB.deck[IB.i]]; IB.cur={m, segs:[], marked:new Set(), done:false};
  $("ibCount").textContent=`Mensagem ${IB.i+1} de ${IB.deck.length}`;
  $("ibCtx").textContent=m.ctx||"";
  const dev=$("ibDevice"); dev.innerHTML="";
  const seg=(content,f,cls)=>{ const s=el("span","hs"+(cls?" "+cls:"")); s.tabIndex=0; s.setAttribute("role","button");
    if(typeof content==="string") s.textContent=content; else s.append(content);
    const id=IB.cur.segs.length; IB.cur.segs.push({f:f||null,node:s}); s.dataset.i=id;
    s.onclick=()=>toggle(id); s.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(id);}};
    return s; };
  const renderRun=(arr,into)=>arr.forEach(x=>{
    if(typeof x==="string") into.append(seg(x));
    else if(x.link){ const s=seg(x.link,x.f,"lk"); s.dataset.url=x.url; into.append(s); }
    else if(x.qr){ const w=el("span"); w.innerHTML=qrSVG(IB.deck[IB.i]*7+3); const s=seg(w,x.f,"qr"); s.dataset.url=x.url; into.append(s); }
    else into.append(seg(x.t,x.f));
  });
  if(m.ch==="email"){
    const box=el("div","mail");
    const bar=el("div","mail-bar"); bar.append(el("span",null,"Caixa de entrada")); box.append(bar);
    const hd=el("div","mail-hd");
    const subj=el("div","mail-subj"); renderRun([typeof m.subject==="string"?m.subject:m.subject],subj); hd.append(subj);
    const r1=el("div","mail-row"); r1.append(el("span","k","De"));
    const fr=el("span"); fr.append(seg(`${m.from.name} <${m.from.addr}>`,m.from.f)); r1.append(fr); hd.append(r1);
    const r2=el("div","mail-row"); r2.append(el("span","k","Para"),el("span",null,m.to)); hd.append(r2);
    const r3=el("div","mail-row"); r3.append(el("span","k","Data"),el("span",null,m.time)); hd.append(r3);
    const tg=el("button","link","Ver cabeçalho completo"); const hx=el("div","mail-headers hide");
    m.headers.forEach(h=>{const ln=el("div"); ln.append(typeof h==="string"?seg(h):seg(h.t,h.f)); hx.append(ln);});
    tg.onclick=()=>{hx.classList.toggle("hide"); tg.textContent=hx.classList.contains("hide")?"Ver cabeçalho completo":"Ocultar cabeçalho";};
    hd.append(tg,hx); box.append(hd);
    const body=el("div","mail-body"); m.body.forEach(p=>{const pp=el("p"); renderRun(p,pp); body.append(pp);});
    if(m.att){ const at=el("div","atts"); m.att.forEach(a=>at.append(seg("📎 "+a.name,a.f,"att"))); body.append(at); }
    box.append(body); dev.append(box);
  } else {
    const ph=el("div","phone "+m.ch);
    const top=el("div","ph-top"); const av=el("span","av",m.ch==="sms"?"✉":"👤"); const who=el("div","who");
    who.append(seg(m.from.name,m.from.f)); if(m.from.note) who.append(el("small",null,m.from.note));
    top.append(av,who); ph.append(top);
    const chat=el("div","chat");
    m.msgs.forEach(x=>{ const bu=el("div","bub "+(x.me?"me":"in")); if(x.me) bu.append(el("span",null,x.b.join(""))); else renderRun(x.b,bu); bu.append(el("span","tm",x.time)); chat.append(bu); });
    ph.append(chat); dev.append(ph);
  }
  const sb=el("div","statusbar hide"); sb.id="ibStatus"; dev.append(sb);
  $("ibResult").classList.add("hide"); $("ibVerdict").classList.remove("hide");
  $("ibMarks").textContent="Nenhum trecho marcado";
}
function toggle(id){
  if(IB.cur.done) return;
  const s=IB.cur.segs[id]; const mk=IB.cur.marked;
  mk.has(id)?mk.delete(id):mk.add(id); s.node.classList.toggle("mk",mk.has(id));
  const url=s.node.dataset.url, st=$("ibStatus");
  if(url){ st.classList.remove("hide"); st.textContent="Destino real: "+url; }
  $("ibMarks").textContent= mk.size? `${mk.size} trecho(s) marcado(s) como suspeito(s)` : "Nenhum trecho marcado";
}
function verdict(v){
  const c=IB.cur, m=c.m; c.done=true;
  const flagIds=Object.keys(m.flags), found=new Set(); let wrong=0;
  c.marked.forEach(i=>{const f=c.segs[i].f; if(f) found.add(f); else wrong++;});
  c.segs.forEach((s,i)=>{ const n=s.node; n.classList.remove("mk");
    if(s.f){ n.classList.add(found.has(s.f)?"found":"missed"); } else if(c.marked.has(i)) n.classList.add("wrongmk"); });
  const ok=v===m.v, pts=found.size*10-wrong*5+(ok?20:0), max=flagIds.length*10+20;
  IB.score+=Math.max(0,pts); IB.max+=max; if(ok) IB.right++; IB.found+=found.size; IB.flagsTotal+=flagIds.length; IB.wrong+=wrong;
  $("ibVerdict").classList.add("hide");
  const r=$("ibResult"); r.innerHTML=""; r.classList.remove("hide");
  const h=el("p","ib-v "+(ok?"ok":"no"), ok?(m.v==="golpe"?"Certo: é golpe.":"Certo: é legítima."):(m.v==="golpe"?"Era golpe.":"Era legítima."));
  r.append(h, el("p","ib-tech",m.tech));
  if(flagIds.length){
    r.append(el("p","ib-sub",`Sinais encontrados: ${found.size} de ${flagIds.length}`+(wrong?` · ${wrong} marcação(ões) em trecho normal`:"")));
    const ul=el("ul","ib-flags");
    flagIds.forEach(f=>{const li=el("li",found.has(f)?"got":"miss"); li.append(el("b",null,found.has(f)?"Encontrado. ":"Não marcado. "), document.createTextNode(m.flags[f])); ul.append(li);});
    r.append(ul);
  } else if(wrong) r.append(el("p","ib-sub",`Você marcou ${wrong} trecho(s) normal(is). Desconfiar é bom, mas saber reconhecer o legítimo também conta.`));
  if(m.note) r.append(el("p","ib-note",m.note));
  const a=el("div","ib-act"); a.append(el("b",null,"O que fazer: "), document.createTextNode(m.act)); r.append(a);
  r.append(el("p","ib-sub",`+${Math.max(0,pts)} de ${max} pontos`));
  const nx=el("button","btn", IB.i<IB.deck.length-1?"Próxima mensagem":"Ver resultado"); nx.onclick=nextMsg; r.append(nx); nx.focus({preventScroll:true});
  r.scrollIntoView({behavior:reduce?"auto":"smooth",block:"nearest"});
}
function nextMsg(){
  if(IB.i<IB.deck.length-1){ IB.i++; renderMsg(); window.scrollTo(0,0); return; }
  const p=Math.round(100*IB.score/IB.max);
  SAVE.best.inbox=Math.max(SAVE.best.inbox||0,p); persist();
  const d=$("ibDevice"); d.innerHTML="";
  $("ibCtx").textContent=""; $("ibCount").textContent="Fim da caixa de entrada";
  const r=$("ibResult"); r.innerHTML=""; $("ibVerdict").classList.add("hide"); r.classList.remove("hide");
  r.append(el("p","ib-big",p+"%"), el("p",null,`Vereditos certos: ${IB.right} de ${IB.deck.length}. Sinais encontrados: ${IB.found} de ${IB.flagsTotal}. Marcações em trechos normais: ${IB.wrong}.`));
  const a=el("div","actions"), b1=el("button","btn","Nova rodada"), b2=el("button","btn ghost","Voltar ao início");
  b1.onclick=()=>startInbox(IB.deck.length>8); b2.onclick=()=>{renderList();show("list");};
  a.append(b1,b2); r.append(a);
}

/* ============================================================ NOTIFICAÇÕES */
const bell=$("bell"), notif=$("notif"), ovl=$("ovl");
const notifOpen=()=>!notif.classList.contains("hide");
const modalOpen=()=>!ovl.classList.contains("hide");

function paintBell(){
  const n=MSGS.length;
  $("bellCount").textContent=n;
  bell.setAttribute("aria-label",`Notificações: ${n} mensagens não lidas`);
  $("notifSub").textContent=`Você tem ${n} mensagens para abrir.`;
  $("notifTtl").textContent=`${n} mensagens suspeitas na caixa de entrada`;
  $("ibGoAll").textContent=`Todas (${n})`;
}
function showNotif(){ notif.classList.remove("hide"); bell.setAttribute("aria-expanded","true"); bell.classList.remove("pulsing"); }
function hideNotif(){ notif.classList.add("hide"); bell.setAttribute("aria-expanded","false"); }
function showModal(){ hideNotif(); ovl.classList.remove("hide"); document.body.style.overflow="hidden"; $("ibGo8").focus(); }
function hideModal(refocus){ ovl.classList.add("hide"); document.body.style.overflow=""; if(refocus!==false) bell.focus(); }

bell.onclick=e=>{ e.stopPropagation(); notifOpen()?hideNotif():showNotif(); };
$("notifOpen").onclick=showModal;
$("mdX").onclick=()=>hideModal();
ovl.addEventListener("click",e=>{ if(e.target===ovl) hideModal(); });
document.addEventListener("click",e=>{ if(notifOpen() && !notif.contains(e.target) && !bell.contains(e.target)) hideNotif(); });
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){ if(modalOpen()) hideModal(); else if(notifOpen()) hideNotif(); return; }
  if(e.key==="Tab" && modalOpen()){
    const f=[...ovl.querySelectorAll("button:not(:disabled)")];
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});
paintBell();

/* ============================================================ EVENTOS */
$("ibGo8").onclick=()=>{ hideModal(false); startInbox(false); };
$("ibGoAll").onclick=()=>{ hideModal(false); startInbox(true); };
$("ibGolpe").onclick=()=>verdict("golpe");
$("ibLegit").onclick=()=>verdict("legit");
$("ibQuit").onclick=()=>{ if(!IB||IB.i===0&&!IB.cur.done||confirm("Sair da caixa de entrada? A rodada atual será perdida.")){ renderList(); show("list"); } };
$("quit").onclick=()=>{ if(confirm("Sair do caso? O progresso desta crise será perdido.")){ leaveCase(); renderList(); show("list"); } };
$("howBtn").onclick=()=>{ R.how=!R.how; renderHow(); };
$("chatBtn").onclick=e=>{ e.stopPropagation(); $("chatPop").classList.contains("hide")?openChat():closeChat(); };
$("chatX").onclick=()=>{ closeChat(); $("chatBtn").focus(); };
document.addEventListener("click",e=>{
  const p=$("chatPop");
  if(!p.classList.contains("hide") && !p.contains(e.target) && !$("chatBtn").contains(e.target)) closeChat();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape" && !$("chatPop").classList.contains("hide")){ closeChat(); $("chatBtn").focus(); }
});
$("lBack").onclick=voltarPontoVirada;
$("lRetry").onclick=()=>startCase(C.id);
$("lOut").onclick=()=>{renderList();show("list");};
$("eRetry").onclick=()=>startCase(C.id);
$("eBack").onclick=()=>{renderList();show("list");};
renderList();
bitsIniciar();
bitsAtualizar();
