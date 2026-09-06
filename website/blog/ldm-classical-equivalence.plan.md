<!--
SUPERSEDED WORKING NOTES — not a post, and deliberately not published.

Renamed to *.plan.md so `website/utils/globRegistry.ts` excludes it from the blog registry;
it therefore has no /blog/<n>/ route, no sitemap entry and no index listing.

The publishable content lives in `website/blog/quantum_cpr.mdx`. The numerics live in
`notebooks/quantum_cpr_v2.ipynb`, which SUPERSEDES two claims below:

  - the "lambda = 1.65, so no squeezing reaches it" argument (section 4) inverts toward a
    benchmark that is a reference point, not an optimum;
  - the "With patient islands, yes" headline (section 5) rests on a steady-state shortcut.
    A proper dynamic-game solve shows entangled selfish islands match a sole owner with the
    SAME patience -- which at beta = 0.9 is only 17% of the ceiling.

Kept for the derivations only. Do not act on the conclusions.
-->

---

publishing_date: 2026-08-06
title: The quantum commons is a co-liability rule
category: "quantum"
secondaryCategory: "others"
description: The Li–Du–Massar entangler, applied to a fishery, is exactly a harbourmaster's clearing rule — and if the islands are patient, it reaches the sustainable optimum.

---

import LDMCircuit from "../components/blog/LDMCircuit";

In an [earlier post](/blog/31/) I ended on a question I could not answer: the quantum prisoner's dilemma hands you a
ready-made institution, so is quantum game theory a way to _generate_ institutions for cooperation problems where we do
not already know the answer? The obvious next target was the tragedy of the commons.

There is a protocol for exactly that. Li, Du and Massar quantised the Cournot duopoly with squeezed light, and
Grau-Climent et al. carried their scheme over to a common-pool resource game. This post works out what that protocol
does. The entangler _is_ an institution — a clearing rule a harbourmaster could run with a rulebook and a ledger. And
whether that institution saves the fishery turns out to hinge entirely on something the protocol itself never mentions:
whether the islands care about next year.

## 1. The fishery, run through the LDM protocol

Two islands fish a shared ground. The Li–Du–Massar (LDM) protocol [Li, Du, Massar, _Phys. Lett. A_ 306 (2002) 73]
defines, for each squeezing parameter $\gamma \ge 0$, a two-player game $Q_\gamma$ built on two harmonic oscillators.

<LDMCircuit />

**Strategy sets.** Island $j \in \{1,2\}$ declares a fleet $b_j \in S_j = [0,\infty)$ — the displacement amplitude of
the unitary $\hat D_j(b_j) = \exp(-i b_j \hat P_j)$.

**The clearing rule.** The expectation values at the end of the protocol are (LDM Eq. 11, Grau-Climent Eq. 5)

$$
b_1^{c} = b_1 \cosh\gamma + b_2 \sinh\gamma, \qquad b_2^{c} = b_2 \cosh\gamma + b_1 \sinh\gamma .
$$

Call $b_j^{c}$ the **licensed fleet** — the number of boats island $j$ is actually credited with. The total licensed
fleet is

$$
B^{c} = b_1^{c} + b_2^{c} = e^{\gamma}\,(b_1 + b_2).
$$

**Payoffs.** Let $v(B)$ be the value of a boat-trip when $B$ boats are on the water — decreasing in $B$, because boats
crowd each other out — and let $c$ be the cost of sending out one boat. Island $j$'s profit is

$$
u_j^{Q}(b_1, b_2) = b_j^{c}\,\big(v(B^{c}) - c\big).
$$

Read that carefully: $b_j^{c}$ multiplies the cost as well as the revenue (Grau-Climent Eq. 7). You are licensed on the
cleared number of boats, and you are billed on it too.

**Notation.** The dictionary against the fishery model in
[`common_pool.ipynb`](https://github.com/fretchen/fretchen.github.io/blob/main/notebooks/common_pool.ipynb), which the
[Moana fishing post](/blog/14/) is built on:

| here            | `common_pool.ipynb` | meaning                                   |
| --------------- | ------------------- | ----------------------------------------- |
| $b_j$           | `b_t[j]`            | boats island $j$ sends out — the decision |
| $B = b_1 + b_2$ | `total_boats_t`     | total fleet                               |
| $v(B)$          | $y(B)/B$            | value per boat                            |
| $b_j\,v(B)$     | `catch_players[j]`  | your catch, in money                      |
| $c\,b_j$        | `c_t = c0*b`        | cost of your fleet                        |
| $u_j$           | catch − cost        | profit                                    |

The one entry with no counterpart runs the other way: there is no fish **stock** anywhere in LDM. The crowding in $v(B)$
is all within a single round. Hold on to that; it is what §4 and §5 turn on.

**Preliminary observation.** $Q_\gamma$ is, at the level of its normal form, a _classical_ strategic game: deterministic
strategy sets and deterministic payoff functions $\mathbb{R}_+^2 \to \mathbb{R}$. The quantum apparatus (vacuum states,
$\hat J(\gamma)$, homodyne detection) is solely a physical _evaluation device_ for the map
$(b_1, b_2) \mapsto (u_1^Q, u_2^Q)$. Two strategic games with identical strategy sets and payoff functions are the same
game, whatever machinery computes the payoffs. The question "what is the classical equivalent?" is therefore well-posed
and purely algebraic.

## 2. Main result

Define the **co-liability fishery $C_\lambda$** for $\lambda \in [0,1)$: strategy sets $[0,\infty)$, ordinary profits
$u_j(b_1, b_2) = b_j\,\big(v(B) - c\big)$, and objectives

$$
V_j(b_1, b_2) = u_j(b_1, b_2) + \lambda\, u_{-j}(b_1, b_2).
$$

Each island maximises its own profit plus a fraction $\lambda$ of its neighbour's. This is the
_coefficient-of-cooperation_ family (Cyert & DeGroot 1973): $\lambda = 0$ is every island for itself, $\lambda \to 1$ is
joint profit maximisation.

**Proposition 1.** For every $\gamma \ge 0$ and every decreasing $v$, the LDM fishery $Q_\gamma$ and the co-liability
fishery $C_\lambda$ have the _same payoff functions_, with

$$
\boxed{\;\lambda = \tanh\gamma\;}
$$

once declared boats are relabelled by $b \mapsto e^{\gamma} b$ (a bijection of $[0,\infty)$ onto itself) and an overall
positive constant $\kappa(\gamma) = e^{-\gamma}\cosh\gamma = \tfrac{1}{2}\left(1 + e^{-2\gamma}\right)$ is applied:

$$
u_j^{Q}(b_1, b_2) = \kappa(\gamma)\, V_j\!\left(e^{\gamma}b_1,\; e^{\gamma}b_2\right) \quad \text{for all } b_1, b_2 \ge 0.
$$

**Proof.** Write $t = \tanh\gamma$ and $\tilde b_j = e^{\gamma} b_j$. Then

$$
b_j^{c} \;=\; \cosh\gamma\,\big(b_j + t\, b_{-j}\big) \;=\; e^{-\gamma}\cosh\gamma\,\big(\tilde b_j + t\,\tilde b_{-j}\big),
$$

and $B^{c} = e^{\gamma}(b_1 + b_2) = \tilde b_1 + \tilde b_2 = \tilde B$. Hence

$$
\begin{aligned}
u_j^{Q} &= e^{-\gamma}\cosh\gamma \,\big(\tilde b_j + t\,\tilde b_{-j}\big)\big(v(\tilde B) - c\big) \\
&= \kappa(\gamma)\,\Big[\, \tilde b_j\big(v(\tilde B) - c\big) \;+\; t\,\tilde b_{-j}\big(v(\tilde B) - c\big) \,\Big] \\
&= \kappa(\gamma)\,\Big[\, u_j(\tilde b) + t\, u_{-j}(\tilde b) \,\Big] \;=\; \kappa(\gamma)\, V_j(\tilde b_1, \tilde b_2). \qquad \blacksquare
\end{aligned}
$$

The proof never touches the shape of $v$. It works because the value term $v(B^c) - c$ is a _common factor_: both
islands face the same crowding, so it survives the factorisation untouched. That is the whole trick, and it is worth
noticing how little the quantum machinery contributes to it.

Note also that this is an exact identity of payoff functions, not merely a first-order-condition match. A relabelling of
the strategies plus an overall positive constant changes nothing anyone optimises: the two games have the same best
replies, the same Nash equilibria, the same comparative statics, even the same off-equilibrium adjustment dynamics, and
their payoffs differ only by the known factor $\kappa(\gamma)$. Every strategic property transfers verbatim.

**Verification against LDM's published results.** Specialise to linear value $v(B) = a - B$ and write $k = a - c$. Then
$u_j = b_j(k - B)$, and $C_\lambda$ is the Cournot duopoly with partial profit internalisation — this special case is
LDM's original model, and it is the only place in this post where the fishery is a firm. Its unique equilibrium solves
$k - 2b_j - (1+\lambda)\,b_{-j} = 0$, giving $b^{*} = \dfrac{k}{3+\lambda}$. Undoing the relabelling, the
declared fleet is $e^{-\gamma}k/(3 + \tanh\gamma)$, and using
$3\cosh\gamma + \sinh\gamma = e^{-\gamma}\left(1 + 2e^{2\gamma}\right)$:

$$
b^{*}_{\text{declared}} = \frac{k \cosh\gamma}{1 + 2e^{2\gamma}},
$$

which is LDM Eq. (13). The equilibrium objective is
$V^{*} = b^{*}(1+\lambda)\big(k - 2b^{*}\big) = \dfrac{k^2 (1+\lambda)^2}{(3+\lambda)^2}$, so

$$
u^{Q*} = \kappa(\gamma)\, V^{*} = \frac{k^2\, e^{\gamma} \cosh\gamma}{\left(3\cosh\gamma + \sinh\gamma\right)^2},
$$

which is LDM Eq. (14), with the limits $k^2/9$ at $\gamma = 0$ ($\lambda = 0$: no cooperation) and $k^2/8$ as
$\gamma \to \infty$ ($\lambda \to 1$: the two islands act as one). The entire profit curve in LDM Fig. 2 is the
classical interpolation between own-profit and joint-profit maximisation, reparametrised by $\lambda = \tanh\gamma$.

## 3. The mechanism, classically: a harbourmaster's clearing rule

Proposition 1 says the protocol implements $\lambda = \tanh\gamma$. It does not say what that _is_. Factorise the
clearing rule the way the proof does:

$$
b_j^{c} \;=\; \cosh\gamma\,\big(b_j + \tanh\gamma\; b_{-j}\big).
$$

Strip the common $\cosh\gamma$ — a change of units, applied identically to both islands — and what remains is a rule any
harbourmaster could publish and enforce:

> Your licensed fleet is your own declared boats, plus a fraction $\tanh\gamma$ of your neighbour's. You are billed and
> paid on that number.

No entanglement, no measurement, no light. Draw the protocol again with those labels and the picture does not change at
all:

<LDMCircuit variant="classical" />

Same two lines, same brackets, same read-out, same formula. This is the exact converse of the move in the
[prisoner's-dilemma post](/blog/31/), where a lawyer's filing cabinet turned out to be a quantum circuit. Here a quantum
circuit turns out to be a filing cabinet.

**What the rule does to Moana.** Put two of the islanders from the [fishing post](/blog/14/) on the two lines — Moana on
one, Chief Kai on the other — and watch one decision. Moana is wondering whether to send out one more boat. The boat
brings in a catch, and it also crowds the ground, so every trip that season is worth a little less. Without the rule she
weighs the catch against the crowding **on her own boats only**. What the extra crowding costs Kai is not her problem.
That gap is the tragedy of the commons, in one sentence.

The harbourmaster closes it by making her a part-owner of Kai's catch. She is licensed and billed on her own boats plus
a share $\lambda$ of his, so she is paid on a slice of whatever he lands. Now her extra boat costs her twice: once
through the crowding on her own catch, and once through the crowding on the slice of Kai's she owns. At
$\lambda \to 1$ she feels the whole of the damage her boat does, and the fleet she picks is the fleet a single owner of
the entire fishery would pick.

Notice what is absent. There is no agreement between Moana and Kai, nothing either of them promised, nobody watching to
see whether they keep their word. This is not cooperation and it needs no enforcement beyond the harbourmaster doing his
arithmetic. Moana is being exactly as selfish as before; the sum in front of her has simply changed.

## 4. Does it save the fishery?

Everything so far is a restatement. Now the question that motivated the whole exercise: put this institution on a real
fishery and does it stop the overfishing?

Take the model from [`common_pool.ipynb`](https://github.com/fretchen/fretchen.github.io/blob/main/notebooks/common_pool.ipynb),
which follows Leach's textbook treatment. A fleet of $B$ boats on a stock $s$ lands a total catch $y(B) = y_0\,s\sqrt{B}$,
shared in proportion to boats. So the value of a boat-trip is the average product,

$$
v(B) = \frac{y(B)}{B} = \frac{A}{\sqrt{B}}, \qquad A = y_0\,s,
$$

with a cost $c_0$ per boat. This is decreasing in $B$, so Proposition 1 applies with no quantum computation at all: the
entangled fishery is the co-liability fishery, and we can just ask what happens to the fish. Let the islands fish year
after year, each season picking the fleet that is best for them at that season's stock, and let the stock rise or fall
by the difference between regrowth and catch. Where does it settle?

|                           | stock | income per year |
| ------------------------- | ----- | --------------- |
| no rule, myopic islands   | 48    | 0.34            |
| entangled, myopic islands | 70    | 0.97            |

The rule helps, and the help is real: nearly three times the income, with no regulator, no quota and no negotiation.
But the fishery is still a wreck. The stock settles at a small fraction of what the ground could carry, and the islands
are poor on it.

The reason is the missing row of the notation table in §1 coming back. Moana now feels what her extra boat costs Kai
this year. She still does not feel what it costs her own island next year.

So on its own the protocol does not save the fishery. But "on its own" is doing more work in that sentence than it
looks, and the next section is about what happens when you relax it.

## 5. With patient islands, yes

It is worth being precise about what went wrong in §4, because the tragedy of the commons is really two problems wearing
one name. There is the externality **between people** — Moana's boats spoil Kai's catch — and the externality **between
times** — Moana's boats this year spoil Moana's catch next year. The harbourmaster's rule closes the first one
completely. It cannot touch the second, because it only ever couples two islands within a single season.

Everything in §4 assumed the islands care only about this year's catch. Economics has one standard object for dropping
that assumption. If island $j$ earns $u_j(t)$ in year $t$, its **discounted payoff** is

$$
U_j \;=\; \sum_{t=0}^{\infty} \beta^{t}\, u_j(t).
$$

The **discount factor** $\beta \in (0,1)$ is a geometric weight in time, exactly like a damping factor; the economics is
all in the reading of it. It is what a euro next year is worth today, so $1/\beta - 1$ is an interest rate. An island
with $\beta$ near 1 is **patient**, one with $\beta = 0$ is **myopic**.

Now run the harbourmaster's clearing rule every season, on islands that are patient. Here is the point that decides
everything, and it is one line of algebra. Discounting is linear in the yearly payoffs, and so is co-liability, so the
two commute:

$$
\sum_{t} \beta^{t}\Big(u_j(t) + \lambda\, u_{-j}(t)\Big) \;=\; U_j + \lambda\, U_{-j}.
$$

The co-liability does not stay trapped inside a single year. It passes straight through the discounting and lands on the
**lifetime** payoffs. Each island ends up maximising its own discounted stream plus a fraction $\lambda$ of its
neighbour's — and at $\lambda \to 1$ that is $U_1 + U_2$, which is exactly the objective a single owner of the whole
fishery would have. The equilibrium is that owner's plan: let the stock recover, then take only the regrowth. The
sustainable optimum, reached by two selfish islands.

So the entangler was never the wrong instrument. It was one of two that are needed:

|                                             | myopic islands ($\beta = 0$)                         | patient islands ($\beta \to 1$)                                     |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| **no entangler** ($\gamma = 0$)             | open access — the tragedy                            | still overfished; each island ignores what its boats cost the other |
| **full entanglement** ($\gamma \to \infty$) | one owner, but a myopic one — still strips the stock | **the owner's optimum — sustainable**                               |

Neither knob alone gets there. Patience without entanglement leaves the islands free-riding on each other; entanglement
without patience merges them into a single owner who strips the fishery anyway. Turn both and they land exactly on the
optimum.

Two things about that bottom-right corner are worth noticing. First, no memory is required. The islands are not
punishing each other for past behaviour, and nobody needs to remember who overfished when — each island's plan depends
only on this year's stock. Second, and more interesting: **nobody computes a quota.** A regulator capping the fleet
would need the biology, the costs and the islands' patience, and would have to solve the whole dynamic problem to find
the number. The harbourmaster publishes $\gamma$ and nothing else. The islands work out the optimum themselves, because
their objectives have been aligned rather than their actions constrained.

**Both of them have to be patient.** The alignment is between Moana and Kai, not between either of them and the future.
If Kai discounts next year steeply and Moana does not, then even at $\lambda \to 1$ they are no longer maximising the
same thing — Kai's objective weights the years differently from hers — and his impatience drags the outcome toward his
preferred fleet. The rule can make two islands agree with each other. It cannot make either of them agree with the
future.

**Does it collapse if they are not patient enough?** You might expect a cliff. In repeated games it is the standard
shape: cooperation holds together while players are patient enough for the threat of retaliation to bite, and collapses
once they are not. There is no cliff here, because nothing is being held up by a threat. Moana is not resisting a
temptation, so there is no point at which resisting stops being worth it. Patience does not decide whether the
arrangement survives — it decides how many fish get left in the water, and it does so smoothly. A patience of $0.93$
holds the stock around 100, $0.98$ holds it near 300, and only near-perfect patience reaches the 518 of the fully
patient owner.

And at the bottom end nothing catastrophic happens either. Even islands that care nothing at all for next year settle
at a stock of about 70 rather than fishing the ground empty, because catching gets expensive as fish get scarce — below
a stock of roughly 30 it is not worth putting a boat in the water. The fish always have that refuge. What impatience
costs is not the fishery's existence but its value: a stock of 70 and an income under 1 per year, against 518 and 7.2
for the patient pair. Same rule, same islands, same physics — seven times poorer.

This goes beyond both LDM and Grau-Climent et al., neither of whom test the protocol against a regenerating stock; the
patient owner's plan is itself standard bioeconomics, where its steady state is called the maximum economic yield. The
open reading list is in my [literature notes](/blog/32/).

## 6. What to make of it

**No quantum advantage in the game-theoretic sense.** Every equilibrium statement about $Q_\gamma$ is a statement about
the classical fishery $C_{\tanh\gamma}$. The cooperative outcome at $\gamma \to \infty$ is not the original game being
solved by quantum means; it is the Nash equilibrium of a _different_ classical game, one in which the externality was
internalised by construction before anyone moved.

**The institution did not come for free.** In the prisoner's dilemma the entangler handed us Saul Goodman's filing
cabinet, and that felt like a gift. Here the price is visible: the referee who prepares
$\hat J(\gamma)\lvert 0\rangle\lvert 0\rangle$, applies $\hat J(\gamma)^{\dagger}$ and reads out the result _is_ the
harbourmaster, and somebody has to run him honestly in the middle of the game. Entanglement does not remove the
regulator; it compiles the regulator into the physics of the payoff channel. What it removes is not the institution but
its _burden of knowledge_ — the harbourmaster still has to exist, he just no longer has to know anything about fish.

**So: can quantum game theory generate institutions?** Here it generated one that works, and it is worth being exact
about which half of the problem it works on. The tragedy of the commons is two externalities under one name: between
people, and between times. The entangler closes the first completely — that is what a two-mode squeezer does to a pair
of quadratures, and it is the half Hardin was writing about. It does nothing whatever about the second. Put the two
together and the fishery is saved, with nobody setting a quota and nobody policing an agreement; supply only the first
and you get islands that are considerate of each other and still strip the ground. The physics delivered half of an
institution, and it happens to be the half that is hard to arrange by hand.

Three limits, since the result is easy to overstate:

**The optimum is approached, never attained.** Since $\lambda = \tanh\gamma$ and squeezing of $S$ decibels means
$e^{2\gamma} = 10^{S/10}$,

$$
\lambda(S) = \frac{10^{S/10}-1}{10^{S/10}+1},
$$

so 10 dB — around the state of the art for a stable optical setup — gives exactly $\lambda = 9/11 \approx 0.82$, and
even 20 dB only reaches $0.98$. The map $\gamma \mapsto \lambda$ compactifies $[0,\infty)$ onto $[0,1)$: realisable
squeezing buys conduct strictly between competition and full merger. A residual sliver of free-riding always survives.

**Patience has to come from somewhere else.** The protocol supplies $\lambda$ and takes $\beta$ as given. Islands that
discount the future steeply are beyond its reach no matter how much light you squeeze, and nothing in the apparatus can
change how much they care about next year.

**Only the limits are worked out here.** I have checked the two corners of the table — myopic and fully patient — not
the whole dynamic game in between. Partial patience with partial entanglement is a harder problem, because each island's
fishing moves the stock and therefore moves what its neighbour does next year. That is a notebook, not a paragraph.

## 7. References

- Li, H., Du, J., Massar, S. (2002), "Continuous-variable quantum games," _Phys. Lett. A_ 306, 73 — the protocol.
- Grau-Climent, J., García-Pérez, L., Alonso-Sanz, R., Losada, J.C. (2023), "Dynamics of a Quantum Common-Pool Resource
  Game with Homogeneous Players' Expectations," _Entropy_ 25, 1585 — LDM applied to a common-pool resource.
- van Enk, S. & Pike, R. (2002), "Classical rules in quantum games," _Phys. Rev. A_ 66, 024306 — the generic
  classical-equivalence critique, which does not work out this mapping.
- Frąckiewicz, P. (2018), "Quantum approach to Cournot-type competition," _Int. J. Theor. Phys._ 57, 353 — LDM
  equilibrium converges to the symmetric Pareto-optimal profile for general Cournot-type games. Proposition 1 explains
  this in one line: joint profit maximisation is Pareto-optimal in the symmetric class.
- Cyert, R. & DeGroot, M. (1973), "An analysis of cooperation and learning in a duopoly context," _Am. Econ. Rev._ 63(1)
  — the coefficient of cooperation.
- Gordon, H.S. (1954), "The economic theory of a common-property resource: the fishery," _J. Polit. Econ._ 62 — open
  access and rent dissipation.
- Acemoglu, D., _Political Economy Lecture Notes_ (MIT 14.773), §3.4 "Common Pool Games" — the dynamic treatment behind
  §5: the discounted-payoff setup, and how the tragedy worsens as the number of players grows.
- Clark, C.W. (1990), _Mathematical Bioeconomics_ — the discounted fishery; the $\beta \to 1$ steady state of §5 is its
  maximum economic yield.
- Hardin, G. (1968), "The tragedy of the commons," _Science_ 162; Ostrom, E. (1990), _Governing the Commons_ — the
  problem, and the catalogue of institutions that actually solve it.
