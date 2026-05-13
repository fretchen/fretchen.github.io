---
publishing_date: 2026-05-10
title: How rational is protectionist voting actually ?
category: "other"
description: I explore how a rational company owner has to vote as he decides if he is in favor of nationalist and protectionist policies.
tokenID: 123
---
 
In the recent context, I had a rather common discussion for our current times with a family member. The topic was the Iran war and the hefty increase in fuel prices that it had triggered. As usual, I did not feel too much pity with people still driving fossil fuels and complaining about high prices. The counterargument was that high prices are one thing. But high prices in Germany compared to neighboring countries only was an unreasonable competitive disadvantage for transport companies. So in the end the counterargument was not about high prices for a private person but about the fact that the transport companies felt really left alone by the government as they felt they had to shoulder a much higher price for the war than others. From there the logic was quite straight-forward:

- This is yet another example of the government not protecting me.
- I clearly have to look out for myself.
- I clearly have to vote the hardcore right wing parties.

In this logic you must decide rationally what is in your highest self-interest to protect your company and you do not reflect about the global good but about your self-interest. And this decision process has quite some analogies with the prisoners dilemma as we will see.

## The real competitive pressure: what the data shows

Before we can evaluate protectionism rationally, we need to understand what the actual competitive pressure looks like. A 2020 study by Kotsios & Folinas measured operating costs per 100 km for a standardised five-axle truck across European national routes. The headline finding: Polish carriers were roughly 31% cheaper than German ones on Polish domestic routes in 2018. But this figure both overstates and understates the relevant problem.

On German roads specifically, the picture is more nuanced. Maut (motorway tolls) applies equally to all vehicles operating in Germany — domestic or foreign. Fuel prices are determined by the local pump. What *does* remain anchored to the home country is the driver's wage. The result is a structural cost advantage for Polish carriers of roughly **15–20%** on German routes — not 31%, but still substantial, and almost entirely wage-driven. *(A detailed cost breakdown is in the backup section below.)*

The law already addresses this wage differential, at least on paper. The EU Mobility Package I, in force since February 2022, requires that drivers performing cabotage or bilateral transport with loading or unloading in Germany must receive the German minimum wage — €12.82 per hour in 2025, rising to €13.90 from January 2026. Violations carry fines of up to €500,000. And Polish wages are moving in the right direction: the gap has narrowed from a ratio of 1:2.8 in 2018 to around 1:1.8 today. The trajectory is encouraging even if the absolute gap remains significant.

The honest read of this data is that German carriers face a real but bounded disadvantage — and one that is **not primarily a structural fact that policy cannot address**. The rules to level the playing field already exist. The problem is enforcement.

## The enforcement gap

Between the law as written and the law as enforced, there is a significant divide. Three mechanisms explain how it persists.

**Structural control deficit at the BAG.** The Bundesamt für Güterverkehr is responsible for roadside controls but lacks the staffing and automated data infrastructure to systematically verify posting conditions at scale. The German federal government's November 2024 parliamentary response to an inquiry about Mobility Package compliance referred to "continuously improved cross-border cooperation" — a formulation that implicitly confirms the deficit more than it rebuts it.

**Bogus self-employment as a workaround.** Polish drivers are frequently classified as formally self-employed, engaged at flat daily rates of around €80 for 13–15 hour days. When freight buyers are asked about working conditions, the routine response is: "We don't know which subcontractor is actually driving for us." This systematically removes the driver from minimum wage coverage and is nearly impossible to prosecute through current control mechanisms.

**Reporting without control infrastructure.** Companies must notify postings through the electronic IMI system (Internal Market Information System), but the link from that notification to actual wage verification is not operationally closed. A driver can carry an A1 certificate (confirming home-country social insurance) without any check on whether the actual hourly wage paid corresponds to the German minimum.

The most significant change currently underway is the rollout of **Smart Tachograph Generation 2**, mandatory for new vehicles since August 2023 and being phased in for existing fleets through 2025. It automatically records border crossings via GPS — eliminating scope for manual falsification — stores data over 56 rather than 28 working days, and allows remote readout by authorities without stopping the vehicle. This makes it technically feasible to determine, without a roadside stop, whether a driver operates regularly in Germany and is therefore subject to the posting rules. The operational link to wage controls is not yet established, but the infrastructure is being built.

The central finding: the competitive disadvantage facing German carriers on German roads is largely a **gap in enforcement of existing rules**, not an unanswerable structural problem. This changes how we should evaluate political responses.

## Modelling the decision process

We can model the whole decision process as follows. Consider two freight carriers — one German, one Polish — each deciding independently whether to support an open market or push for protectionist measures. We call these two choices **Open** and **Protect**. The profit of each carrier is simply:

$$\text{Profit} = \text{Price} - \text{Cost}$$

In an open market, both carriers face the same market price $P_0$, but the German carrier has higher operating costs $C_{DE}$ than the Polish carrier $C_{PL}$ — reflecting real differences in wages, fuel taxes, and compliance costs. When the German side enacts protection, domestic freight prices rise by some amount $a$, since foreign competition is reduced. This helps the German carrier on domestic routes. But if Poland responds in kind — which in practice it will — German carriers face retaliatory costs $k$ on their cross-border business.

The net effect of mutual protection for the German carrier thus depends on whether the domestic price gain $a$ outweighs the retaliation cost $k$.

### The simple case for protectionism

The logic for protectionism is straightforward: if the German carrier chooses **Protect** the price will go up and almost certainly increase its profit on domestic routes. The downside is much more fuzzy. If Poland retaliates, this is likely to increase costs for the German carrier. But how much does he really care? It is likely that the German carrier is primarily focused on domestic routes, the retaliation cost $k$ is rather negligible compared to the price increase $a$.

### The slightly involved case for open markets

The logic to keep the market open is much more involved from the perspective of the German carrier. The biggest downside is that the closed market will lead to higher prices, which might make the German carrier more profitable. However, the clients are very unlikely to be happy about this increase. And while they might not be able to do much about it at the beginning, they are looking for alternatives. Just move the factory and transport will go down.

## Realistic alternatives

So suppose now that you really want to keep open markets. Most German carriers are already quite optimised — there is no easy internal efficiency gain left on the table. The question is therefore not operational but political: what can governments actually do to close the cost gap without resorting to protectionism?

The standard answer from the classical right — cut taxes, reduce regulation, shrink the state — is not wrong, but it is dangerously incomplete. It addresses only one side of the equation ($C_{DE}$ down) while ignoring that the competitive pressure comes not just from Poland's lower costs today, but from the structural divergence in wages, fuel taxation, and compliance costs that has built up over decades. Cutting diesel taxes in Germany gets you perhaps a few percent. The actual cost gap is closer to 15–20%.

There are three levers that actually matter:

**Lever 1: Reduce $C_{DE}$ — but climatically compatible.**
The biggest cost item for a German carrier is labour (~35–40% of operating costs), followed by fuel. Attacking the labour cost directly means cutting wages, which is not politically viable and would simply redistribute poverty. The smarter interventions are indirect: reducing the administrative burden (digitising customs, driving logs, and cabotage controls), shortening driver training pathways to address the structural shortage that inflates salaries through scarcity, and — critically — accelerating the transition to electric or hydrogen trucks. This sounds paradoxical, but modelling by Agora Verkehrswende shows that the total cost of ownership of battery-electric heavy trucks is already competitive with diesel in high-utilisation scenarios, and the gap will close further by 2030. A carrier that transitions early locks in lower per-kilometre energy costs before competitors do.

**Lever 2: Raise $C_{PL}$ — through EU harmonisation, not tariffs.**
This is the most underrated lever and the one most consistent with open markets. As the enforcement gap analysis shows, the legal framework for wage harmonisation already exists — the EU Mobility Package requires German minimum wages for drivers posting to Germany. The gap is in enforcement, not in law. Closing it through the Smart Tachograph 2 infrastructure, stricter posted worker controls, and an ambitious European minimum wage directive would structurally narrow the competitive gap without a single tariff. Polish wages in trucking rose by over 20% in 2022 alone and again by a quarter in 2024–2025 — the direction is right, the question is pace and enforcement.

**Lever 3: Make retaliation credible — at the EU level.**
The game-theoretic analysis shows that open markets become a rational equilibrium only when the retaliation cost $k$ is high enough relative to the protectionist gain $a$. Individually, Germany cannot credibly threaten meaningful retaliation against Poland without violating EU law. But the EU can — through reciprocity mechanisms in market access rules, through Mobility Package enforcement powers, and through the Carbon Border Adjustment Mechanism (CBAM), which from 2026 will apply CO₂ price differentials to imports from countries with weaker climate policy. CBAM does not directly target freight, but it signals the direction: the EU is willing to use its market power to enforce standards.

The honest conclusion is that none of these levers is fast, cheap, or politically easy. But the alternative — protectionism — delivers a short-term price increase ($a$) that feels good for domestic carriers, followed by client relocation decisions that shrink the total volume of freight to be carried. The factory that moves to avoid higher logistics costs takes its transport demand with it. The carriers who voted for protection are then competing for a smaller market at inflated prices. That is not a winning strategy. It is a slowly closing trap.

## What the parties offer — and where they fall short

The classical right (CDU/CSU, FDP) focuses almost exclusively on reducing $C_{DE}$ through tax cuts, deregulation, and lower fuel levies. The diagnosis is not wrong — German carriers do face a real cost disadvantage — but the proposed cure is undersized. Diesel tax relief closes perhaps a few percent of a 15–20% cost gap, and it does nothing to address the structural wage divergence or to make the retaliation cost $k$ credible.

The AfD's offer is more emotionally coherent but economically self-defeating. A closed market does raise domestic prices ($a$ goes up), which feels like relief. But as the prisoner's dilemma structure makes clear, the equilibrium outcome of mutual protection is worse for both sides than open competition — and more importantly, it triggers the client relocation dynamic: the factory that moves to avoid higher logistics costs takes its freight demand with it. The AfD has no answer to that second-order effect.

The Greens correctly identify the transformation pathway — electrification, modal shift to rail, carbon pricing — but systematically underestimate the transition costs for smaller carriers. A Polish competitor with an old diesel truck pays the same CO₂ surcharge on German roads as a German carrier, but remains 20–30% cheaper on everything else. During the transition window, aggressive climate policy without accompanying support measures can worsen the competitive position of German carriers before the long-run cost advantages of electrification materialise. This is not an argument against the green agenda — it is an argument for sequencing it correctly.

The SPD's most relevant contribution is the one already underway: wage harmonisation. Polish trucking wages rose by over 20% in 2022 and by a further quarter in 2024–2025, driven partly by the EU Mobility Package that the SPD supported. Stricter enforcement of posted worker rules — requiring German wage floors for any driver operating in Germany — is the single fastest lever to structurally narrow $C_{PL}$. The SPD supports this; its weakness is that it has no coherent strategy for financing the green transition in the sector.

Volt is structurally the best fit for the logic of this analysis, precisely because it operates at the level where the solution actually lives: the EU. Wage harmonisation, posted worker enforcement, and credible retaliation through mechanisms like CBAM are all EU-level instruments. Volt's explicit combination of pro-free-trade and pro-EU-integration positions maps directly onto Lever 2 and Lever 3 above. Its weakness is the absence of a specific industrial policy for financing the carrier transition — the $C_{DE}$-reduction side of the equation.

The honest summary is that no single party covers all three levers. The closest approximation to an integrated answer would combine the SPD's wage-floor enforcement, Volt's EU-level institutional ambition, and a green transition subsidy programme targeted specifically at small and medium carriers — none of which currently exists as a coherent package in any party's platform.

---

## Sources

[1] Kotsios, P. & Folinas, D. (2020). Analysis and Comparison of Road Freight Transport Cost in 20 European Countries. *IJAL*, 10(1). DOI: 10.4018/IJAL.2020010102

[2] Bundesregierung (2024). Antwort auf Kleine Anfrage CDU/CSU zur Einhaltung des EU-Mobilitätspakets. November 2024. Via trans.info.

[3] Hans-Böckler-Stiftung / WSI (2026). Mindestlohnbericht 2026. boeckler.de, März 2026.

[4] EU-Verordnung Nr. 2021/1228 (Smart Tachograph 2); EU-Richtlinie 2020/1057 (Entsenderecht Strassenverkehr).

[5] Faire Mobilität / LabourNet Germany (2024). Interview Anna Weirich, Frankfurter Rundschau, März 2024.

[6] Parakar (2025). Gehaltsabrechnung und Arbeitsrecht Polen 2025. parakar.eu.

[7] EU Mobility Package I, in force from February 2022.

[8] Volt Deutschland, Grundsatzprogramm 2021; see also *Deutsche Vereinigung für Politikwissenschaft* (2022).

---

## Backup / Ablage

### Detailed cost breakdown on German roads

The Kotsios & Folinas (2020) study measures costs per 100 km on national routes. For German-road competition, a hybrid model applies: maut and fuel are route-specific costs (equal for all operators on German roads), while driver wages remain anchored to the home country.

| Cost component | PL on PL routes | PL on DE routes | DE on DE routes |
| --- | --- | --- | --- |
| Driver (min. wage basis) | €3.96 | €3.96* | €11.05 |
| Fuel | €29.95 | ~€34.45 | €34.45 |
| Maut | €6.27 | €15.60 | €15.60 |
| Tyres | €5.67 | €5.67 | €5.29 |
| **Total** | **€45.85** | **~€59.68** | **€66.38** |

*Without posted worker rule enforcement. Source: Kotsios & Folinas (2020), own extension.

The calculated gap on German routes is ~9% using the statutory minimum wage as the labour benchmark. Since actual German trucking wages in 2025 are significantly above the minimum (median: ~€2,786–€3,321/month gross, well above the minimum wage floor), the realistic gap is closer to 15–20%.

### Wage data: precise figures (2025)

- Polish minimum wage 2025: 4,666 PLN gross/month (~€1,085/month at current exchange rate), hourly rate 30.50 PLN (~€7.09/h).
- German minimum wage 2025: €12.82/h, rising to €13.90/h from January 2026.
- Ratio 2025: approx. 1:1.8, compared to 1:2.8 in 2018.
- Measured as a share of national median wage, Poland (59.1%) has a higher relative minimum wage than Germany — indicating that structural harmonisation is advancing even as the absolute purchasing-power gap remains significant.
- The EU Minimum Wage Directive was upheld in principle by the ECJ in November 2025; national implementation is underway.

Source: Parakar (2025); Hans-Böckler-Stiftung / WSI (2026).

### Bureaucracy as a cost factor

Bureaucracy costs are a real but hard-to-quantify factor for German carriers. A 2025 follow-up study by IfM Bonn for the IMPULS Foundation measured bureaucracy costs of between 1.3 and 6 percent of revenue for SMEs in mechanical engineering — with the smallest firms at the upper end. A directly comparable study for freight carriers does not exist, but the cost structure is analogous: documentation requirements for driving and rest periods, posting notifications, eCMR, toll billing, and customs paperwork create administrative overhead that disproportionately affects small operators.

Critically, this burden is asymmetric: German firms bear it fully, while foreign operators face the same requirements but often do not comply — and escape consequences due to insufficient controls. Digitising control processes, as the Smart Tachograph 2 technically enables, would reduce this overhead for compliant operators while simultaneously improving enforcement against violations. In this context, cutting bureaucracy and improving enforcement are complementary rather than opposing goals.

*Source: IfM Bonn / IMPULS-Stiftung (2025). Bürokratiekosten von Unternehmen aus dem Maschinen- und Anlagenbau – Folgestudie. Februar 2025.*

### Legal note: the transit exemption

Pure transit journeys (no loading or unloading in Germany) are exempt from German minimum wage requirements — following EU Commission intervention against the original 2015 German Minimum Wage Act, which had sought to include transit as well. This exemption limits enforcement scope but does not affect bilateral and cabotage operations, which are the economically relevant competitive cases.

*Source: Wirtschaftsdienst (2020). Eisenkopf / Knorr: Entsenderecht im Strassengüterverkehr.*
