import{t as e}from"./chunk-CRAtDASX.js";var t=e(),n={publishing_date:`2026-08-27`,title:`Common-pool resources, expanded in the discount factor`,category:`others`,description:`Notes on the common-pool model — the tragedy derived for N users, the patient planner expanded order by order in the discount factor, and a textbook fishery worked through at the end.`};function r(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Common-pool resources`}),` are a powerful and frequent model in economics. The idea is that nobody can be kept away from the pool,
and every unit one person takes is a unit nobody else can. Fish stocks
are the textbook case. So are groundwater basins, grazing land, road space at rush hour or the atmosphere, considered as a place to put carbon: no one can be
excluded from using it, and every tonne emitted uses up part of a finite budget.`]}),`
`,(0,t.jsxs)(n.p,{children:[`What follows are notes on the general model and then I apply them to the example of fishery. I wrote about the same fishery `,(0,t.jsx)(n.a,{href:`/blog/14/`,children:`earlier`}),` but this time it
is all math.`]}),`
`,(0,t.jsx)(n.h2,{children:`The commons`}),`
`,(0,t.jsxs)(n.p,{children:[`A common-pool problem needs very little to write down. There is a `,(0,t.jsx)(n.strong,{children:`stock`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_t`}),` — fish in the
sea, water in the aquifer, room left in the carbon budget. Several users draw on it; user `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`j`}),`
takes `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j`}),`, and what happens to the pool depends only on the total draw`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`B_t = \\sum_j b_j .`})}),`
`,(0,t.jsxs)(n.p,{children:[`Drawing pays. Write `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u_{j,t}`}),` for what user `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`j`}),` earns in season `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`t`}),`, and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u(B_t, s_t)`}),` for what
they earn between them — a season's payoff depends on how hard the pool is being worked and on how
much is in it. What makes this a problem rather than a list is that `,(0,t.jsx)(n.strong,{children:`the stock remembers`}),`:
whatever is left, plus whatever grows back on its own, is the starting point for next season,`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`s_{t+1} = \\sigma(B_t, s_t) .`})}),`
`,(0,t.jsxs)(n.p,{children:[`Nothing in the derivation depends on the shape of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),` or `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma`}),`, which is the whole reason for
writing them this way. Users also care about seasons other than this one, and weight the future
geometrically:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`U_j = \\sum_{t=0}^{\\infty} \\beta^{t}\\,u_{j,t} .`})}),`
`,(0,t.jsxs)(n.p,{children:[`A geometric weight in time, exactly like a damping factor. `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),` near 1 is a patient user,
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta = 0`}),` one who does not think about next season at all.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Three conventions, all to save trouble later. `,(0,t.jsx)(n.strong,{children:`A subscript is always a season`}),` — `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_t`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_t`}),` —
and the user label `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`j`}),` drops away almost at once, because from the planner's point of view only
the total matters. `,(0,t.jsxs)(n.strong,{children:[`Derivatives are written `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial`})]}),`: since `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma`}),` each take two
arguments, a derivative has to say which one it acts on, so `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_s u`}),`,
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_{BB} u`}),` — never a prime, never a subscript, the subscript slot being spoken for. And
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_B u\\big)_t`}),` means that derivative `,(0,t.jsxs)(n.strong,{children:[`evaluated in season `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`t`})]}),`, which keeps the
subscript a season even there.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The third is vocabulary. These are the quantities economists call `,(0,t.jsx)(n.strong,{children:`marginal`}),`, and the word is
less forbidding than it looks: it is simply their way of saying `,(0,t.jsx)(n.em,{children:`the derivative of`}),`. What it does
not say on its own is `,(0,t.jsx)(n.em,{children:`with respect to what`}),` — that lives in the phrase that follows. The noun
names what gets differentiated and the "of …" names what it is differentiated by, so
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u`}),` is the marginal payoff `,(0,t.jsx)(n.strong,{children:`of one more unit drawn`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_s u`}),` the marginal
payoff `,(0,t.jsx)(n.strong,{children:`of one more unit left in the pool`}),`. The "of" and the subscript on `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial`}),` carry
exactly the same information; the notation is just the more honest of the two, since it can never
quietly leave the "of" out.`]}),`
`,(0,t.jsx)(n.h2,{children:`Independent actors`}),`
`,(0,t.jsxs)(n.p,{children:[`So far `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u(B,s)`}),` is what the pool pays out as a whole. To say what happens when `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` users draw on
it independently, one thing has to be added: how that payout is divided. Take the obvious rule —
each user gets the share matching how hard it worked,`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`u_j = \\frac{b_j}{B}\\,u(B,s) .`})}),`
`,(0,t.jsx)(n.p,{children:`That is the only new assumption in this section.`}),`
`,(0,t.jsxs)(n.p,{children:[`Each user picks `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j`}),` to make its own `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u_j`}),` as large as possible, taking everyone else's draw as
given. Raising `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j`}),` raises `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B`}),` one for one, so`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\frac{\\partial u_j}{\\partial b_j}
= \\frac{u}{B} \\;+\\; \\frac{b_j}{B}\\Big(\\partial_B u - \\frac{u}{B}\\Big) \\;=\\; 0 .`})}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-u/B`}),` in the bracket is the dilution of your own share: raising `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j`}),` raises `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B`}),` too, which
splits the pool more thinly. It comes from differentiating the share `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j/B`}),`, not from `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`That bracket is worth a name of its own. Write`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`D \\;\\equiv\\; \\frac{u}{B} - \\partial_B u`})}),`
`,(0,t.jsxs)(n.p,{children:[`for how much less one more unit of effort earns than the units already working — the `,(0,t.jsx)(n.strong,{children:`damage`}),` a
unit does. `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D`}),` is positive whenever `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),` is concave in `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B`}),` and pays nothing for no effort,
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u(0,s) = 0`}),` — and those are the only properties of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),` this section needs. Diminishing returns
and crowding are not separate ingredients; they are two names for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D > 0`}),`. With that, the
condition reads`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\frac{\\partial u_j}{\\partial b_j}
= \\underbrace{\\frac{u}{B}}_{\\text{what you collect}}
\\;-\\; \\frac{b_j}{B}\\underbrace{\\vphantom{\\frac{u}{B}}D}_{\\text{the damage}}
\\;=\\; 0 ,`})}),`
`,(0,t.jsxs)(n.p,{children:[`and if the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` users are alike they draw alike, so `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_j/B = 1/N`}),` and it becomes simply`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\frac{u}{B} \\;=\\; \\frac{D}{N} .`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`That one line is the tragedy of the commons.`}),` Read it as an instruction: draw until what you
collect equals the share of the damage you carry. You are paid `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B`}),` for the extra unit — the full
going rate, because your share grows with your effort. The damage it does is `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D`}),`, but `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D`}),` lands on
all `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` users, so your own bill is `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D/N`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`It is a dinner split `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` ways. You eat the whole extra dish and pay a fraction of it, so you order
too much — and so does everyone else, for exactly the same good reason.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The consequence follows at once. Raising `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` shrinks `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D/N`}),`, so `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B`}),` has to shrink to match, and
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B`}),` only falls as `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B`}),` grows. `,(0,t.jsx)(n.strong,{children:`More users, more effort, less left over`}),` — with nobody behaving
badly. Each is doing the best available thing given what the others do.`]}),`
`,(0,t.jsx)(n.p,{children:`The two ends of that range are worth naming.`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N = 1`})}),` gives `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B = D`}),`, which is `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u = 0`}),`: draw until one more unit adds nothing
to the pool. You are dining alone and pay the whole bill, so you order exactly as much as you
want.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N \\to \\infty`})}),` sends `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D/N`}),` to zero, so `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B = 0`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u = 0`}),`. Your share of the bill has
vanished, and the pool ends up yielding exactly what it costs to work it — no more.`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`The planner`}),`
`,(0,t.jsxs)(n.p,{children:[`The first of those limits is worth dwelling on, because it is the benchmark the rest of this post
measures against. A planner is usually introduced as somebody from outside — a manager, a
regulator, an authority with better information. None of that is needed. `,(0,t.jsxs)(n.strong,{children:[`The planner is simply
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N = 1`})]}),`: the same first-order condition with the externality switched off.`]}),`
`,(0,t.jsx)(n.p,{children:`And he will always try to maximise the total discounted payoff:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\max_{\\{B_t\\}_{t=0}^{\\infty}}\\; U = \\sum_{t=0}^{\\infty} \\beta^{t}\\,u(B_t, s_t),
\\qquad \\text{subject to}\\qquad s_{t+1} = \\sigma(B_t, s_t),`})}),`
`,(0,t.jsxs)(n.p,{children:[`with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_0`}),` given. Working this out in general is analytically not possible but likely we have a good
perturbation parameter in `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta \\ll 1`}),`, with both the fleet and the payoff as polynomials:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`B_t = B_t^{(0)}+\\beta B_t^{(1)}+\\cdots, \\qquad U = U^{(0)}+\\beta U^{(1)}+\\beta^{2} U^{(2)}+\\cdots`})}),`
`,(0,t.jsx)(n.h3,{children:`Zeroth order`}),`
`,(0,t.jsxs)(n.p,{children:[`At `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta = 0`}),` only `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`t = 0`}),` survives and the planner maximises this season alone:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`U^{(0)} = u\\big(B_0^{(0)}, s_0\\big), \\qquad \\big(\\partial_B u\\big)_0 = 0 .`})}),`
`,(0,t.jsxs)(n.p,{children:[`The second equation is the `,(0,t.jsx)(n.strong,{children:`myopic rule`}),` — the best fleet if next year did not exist — and it
defines a policy `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B^{(0)}(s)`}),`, one fleet for each stock. That is the entire zeroth order.`]}),`
`,(0,t.jsxs)(n.p,{children:[`It is worth seeing how far that is from what the independent actors do. Their condition was
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u/B = D/N`}),` with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D = u/B - \\partial_B u`}),`; eliminating `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`D`}),` between the two gives`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\big(\\partial_B u\\big)_{N\\text{ users}} \\;=\\; (1-N)\\,\\frac{u}{B} ,`})}),`
`,(0,t.jsxs)(n.p,{children:[`which is negative for every `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N > 1`}),`. They stop at a point where the pool's total payoff is already
`,(0,t.jsx)(n.em,{children:`falling`}),` — past the top of the hill, on the way down. The planner, at `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u = 0`}),`, stops
exactly on the summit. That is the precise sense in which it does better, and the gap between the
two is the whole of the tragedy.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Keep the condition `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u = 0`}),` in view, though. It is about to do a great deal of work: at
every order from here on, some term arrives multiplied by it and vanishes.`]}),`
`,(0,t.jsx)(n.h3,{children:`First order`}),`
`,(0,t.jsxs)(n.p,{children:[`Two things feed the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta^{1}`}),` coefficient: season 1 at zeroth order, and the first-order
correction to season 0's fleet. Expanding `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u`}),` around `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(0)}`}),`,`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`U^{(1)} = \\underbrace{\\big(\\partial_B u\\big)_0\\,B_0^{(1)}}_{=\\;0} + u\\big(B_1^{(0)}, s_1^{(0)}\\big)`})}),`
`,(0,t.jsxs)(n.p,{children:[`and the first term vanishes — its bracket is the zeroth-order condition. `,(0,t.jsx)(n.strong,{children:`The correction to
today's fleet drops out of the first-order payoff.`})]}),`
`,(0,t.jsxs)(n.p,{children:[`What survives is the same one-season problem, one season later. Maximising over `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_1^{(0)}`}),`
returns the myopic rule at the new stock:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`B_1^{(0)} = B^{(0)}\\big(s_1^{(0)}\\big), \\qquad s_1^{(0)} = \\sigma\\big(B_0^{(0)}, s_0\\big) .`})}),`
`,(0,t.jsx)(n.p,{children:`So through first order`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`U = u\\big(B_0^{(0)}, s_0\\big) + \\beta\\,u\\big(B_1^{(0)}, s_1^{(0)}\\big) + O(\\beta^{2}),`})}),`
`,(0,t.jsx)(n.p,{children:`the same expression twice, one season apart.`}),`
`,(0,t.jsxs)(n.p,{children:[`But notice what we have not got. `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(1)}`}),`, the correction to `,(0,t.jsx)(n.em,{children:`today's`}),` fleet and the thing we
actually want, has cancelled. It appears at second order.`]}),`
`,(0,t.jsx)(n.h3,{children:`Second order`}),`
`,(0,t.jsxs)(n.p,{children:[`Three seasons now contribute, season `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`t`}),` entering at boat-order `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`2-t`}),`. Two of the three collapse
on sight.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Season 0`}),` contributes its second-order Taylor remainder. The `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(2)}`}),` piece arrives
multiplied by `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_B u\\big)_0 = 0`}),` and dies exactly as `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(1)}`}),` did one order ago,
leaving only the quadratic `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\tfrac{1}{2}\\big(\\partial_{BB} u\\big)_0\\big(B_0^{(1)}\\big)^2`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Season 1`}),` carries an explicit `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),`, so it reaches `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta^2`}),` through its own first-order
parts. Its `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_1^{(1)}`}),` piece is multiplied by `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_B u\\big)_1`}),` — zero for the same
reason. What survives is the dependence on the `,(0,t.jsx)(n.em,{children:`stock`}),`, because `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_1`}),` is not a constant: it
inherits a `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),`-dependence from `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0`}),`, namely
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_1^{(1)} = \\big(\\partial_B \\sigma\\big)_0\\,B_0^{(1)}`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Season 2`}),` contributes a fresh myopic season. Altogether`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`U^{(2)} = \\underbrace{\\tfrac{1}{2}\\big(\\partial_{BB} u\\big)_0\\big(B_0^{(1)}\\big)^{2}}_{t=0}
\\;+\\; \\underbrace{\\big(\\partial_s u\\big)_1\\,\\big(\\partial_B \\sigma\\big)_0\\,B_0^{(1)}}_{t=1}
\\;+\\; \\underbrace{u\\big(B_2^{(0)}, s_2^{(0)}\\big)}_{t=2} .`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(1)}`}),` now appears twice, and in two structurally different ways: `,(0,t.jsx)(n.strong,{children:`quadratically`}),` through
season 0, `,(0,t.jsx)(n.strong,{children:`linearly`}),` through season 1. That pairing is what makes the problem well posed. A
downward parabola plus a line has one interior maximum — with only the line the correction would
run away, and with only the parabola it would sit at zero and patience would never move anything.
The two terms are the cost of leaving the myopic optimum and the reward for the stock that buys.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Setting `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial U^{(2)} / \\partial B_0^{(1)} = 0`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`B_0^{(1)} = -\\frac{\\big(\\partial_B \\sigma\\big)_0\\;\\big(\\partial_s u\\big)_1}{\\big(\\partial_{BB} u\\big)_0}`})}),`
`,(0,t.jsx)(n.p,{children:`That is the whole result, and it is three derivatives of two functions. How hard the control
pushes the state, what a richer state is worth next season, and how sharply this season's profit
falls away from its peak — nothing else about a problem matters at this order.`}),`
`,(0,t.jsxs)(n.p,{children:[`Note what `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_s u\\big)_1`}),` is: the `,(0,t.jsx)(n.strong,{children:`marginal value of one more unit left in the pool`}),` —
how much extra next season earns from starting slightly fuller. It is an exchange rate between the
stock and money, and that is precisely the number you need in order to weigh a unit taken today
against a unit left for tomorrow.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Since `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_{BB} u < 0`}),`, the sign of the correction is the sign of
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_B \\sigma\\big)_0\\big(\\partial_s u\\big)_1`}),`: `,(0,t.jsx)(n.strong,{children:`the control moves toward whatever
raises tomorrow's value.`}),` Both factors can carry either sign, and the two examples at the end of
this post are chosen so that each carries the opposite one.`]}),`
`,(0,t.jsx)(n.h2,{children:`Sustainability`}),`
`,(0,t.jsxs)(n.p,{children:[`Sustainability sounds like a test a policy passes or fails. In this model it is better read as a
`,(0,t.jsx)(n.strong,{children:`destination`}),`: a stock is steady when the draw exactly matches what grows back,`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\sigma(B, s) \\;=\\; s .`})}),`
`,(0,t.jsxs)(n.p,{children:[`That is not one condition but a family of them — for every level of effort, a stock at which the
pool stops moving. Draw too hard and the stock falls until the two balance; too gently and it rises
until they do. Leach works his whole dynamic chapter from this curve, and the useful fact is that
`,(0,t.jsx)(n.strong,{children:`every planner ends up somewhere on it`}),` (§8.2 of `,(0,t.jsx)(n.em,{children:`A Course in Public Economics`}),`). So the question
is never whether a policy is sustainable in the long run, only `,(0,t.jsx)(n.em,{children:`which`}),` resting point it reaches.`]}),`
`,(0,t.jsxs)(n.p,{children:[`That is what `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),` decides. At `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta = 0`}),` the planner applies the myopic rule wherever it finds
itself and drifts to the resting point that rule implies — sustainable, and poor. As `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta \\to 1`}),`
the journey stops counting against an infinite stay at the destination, so the planner simply picks
the resting point with the `,(0,t.jsx)(n.strong,{children:`largest payoff`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Where it lands in between is a solved problem, and the answer is worth having even without the
derivation. The move, due to Clark and Munro, is to treat the stock as `,(0,t.jsx)(n.strong,{children:`capital`}),`: a fish left in
the water is an investment like any other, and the planner holds the pool at the size where the
resource's own rate of return matches the discount rate — exactly the rule you would apply to a
bond or a factory. Everything in the worked example below is a special case of it. The derivation
is optimal control and it is done properly in Colin Clark's `,(0,t.jsx)(n.em,{children:`Mathematical Bioeconomics`}),`; the
original argument is Clark and Munro, `,(0,t.jsx)(n.em,{children:`The economics of fishing and modern capital theory`}),`, Journal
of Environmental Economics and Management `,(0,t.jsx)(n.strong,{children:`2`}),` (1975).`]}),`
`,(0,t.jsx)(n.h2,{children:`Example: Fishery`}),`
`,(0,t.jsxs)(n.p,{children:[`To put numbers on any of this we need an instance, and the fishery is the one you can picture.
John Leach sets it up in §8.1 of `,(0,t.jsx)(n.em,{children:`A Course in Public Economics`}),`, and I used it in an
`,(0,t.jsx)(n.a,{href:`/blog/14/`,children:`earlier post`}),`. Two islands send `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_1`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b_2`}),` boats onto the same ground, so
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_t`}),` is the fleet on the water and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_t`}),` the fish stock. Three equations close it:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Catch.`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y_t = q\\,s_t\\sqrt{B_t}`}),` — more boats land more fish, but with diminishing returns,
and a richer stock is easier to fish. The catchability `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`q`}),` says how good the gear is.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Renewal.`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`g(s) = r\\,s\\,(1 - s/K)`}),` — the usual logistic regrowth, with intrinsic rate `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`r`}),`
and carrying capacity `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`K`}),`. Fastest at half of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`K`}),`, zero at both ends.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`What is left.`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_{t+1} = s_t + g(s_t) - y_t`}),` — this season's catch sets next season's
starting point.`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`The catch is shared in proportion to boats and each boat costs `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c`}),` to send, so island `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`j`}),` earns
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u_j = b_j (v - c)`}),` in a season, where `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`v \\equiv y/B = q\\,s/\\sqrt{B}`}),` is what one boat-trip is
worth. It falls as the ground gets crowded, which is the only reason any of this is interesting.
In the general notation of the last section, this fishery is the case`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`u(B,s) = q\\,s\\sqrt{B} - c\\,B, \\qquad \\sigma(B,s) = s + g(s) - q\\,s\\sqrt{B} .`})}),`
`,(0,t.jsxs)(n.p,{children:[`Throughout, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`q = 0.01`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c = 0.125`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`r = 0.03`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`K = 1000`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_0 = 100`}),`.`]}),`
`,(0,t.jsx)(n.h3,{children:`What the tragedy costs`}),`
`,(0,t.jsxs)(n.p,{children:[`Take the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),`-user condition first. With `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u = q s\\sqrt{B} - cB`}),` the two pieces it balances are`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\frac{u}{B} = \\frac{q\\,s}{\\sqrt{B}} - c , \\qquad \\partial_B u = \\frac{q\\,s}{2\\sqrt{B}} - c ,`})}),`
`,(0,t.jsxs)(n.p,{children:[`so the catch term appears at half strength in the second — that is what diminishing returns amount
to here. Substituting into
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(1-\\tfrac1N\\big)\\tfrac{u}{B} + \\tfrac1N \\partial_B u = 0`}),`, the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c`}),` terms combine to exactly
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-c`}),` and the rest to `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\tfrac{q s}{\\sqrt B}\\big(1-\\tfrac{1}{2N}\\big)`}),`, giving the equilibrium
fleet `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B^{*}(N)`}),` — the total number of boats `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`}),` independent islands end up sending — in closed
form:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`B^{*}(N) = \\Big(\\frac{q\\,s_0}{c}\\Big)^{2}\\Big(1-\\frac{1}{2N}\\Big)^{2} .`})}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{}),(0,t.jsx)(n.th,{children:`one owner`}),(0,t.jsx)(n.th,{children:`two islands`}),(0,t.jsx)(n.th,{children:`open access`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`N`})}),(0,t.jsx)(n.td,{children:`1`}),(0,t.jsx)(n.td,{children:`2`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\to\\infty`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`boats on the water`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`16`})}),(0,t.jsx)(n.td,{children:`36`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`64`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`profit between all`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`2.00`})}),(0,t.jsx)(n.td,{children:`1.50`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`0`})})]})]})]}),`
`,(0,t.jsx)(n.p,{children:`Four times the fleet, for nothing at all. That gap is the tragedy of the commons, and it is the
distance any institution has to close. Two islands already give away most of it — 36 boats is
closer to open access than to the owner — which is worth knowing before assuming that a small
group will sort itself out.`}),`
`,(0,t.jsx)(n.h3,{children:`The derivatives the expansion needed`}),`
`,(0,t.jsxs)(n.p,{children:[`Everything in the general derivation ran on three derivatives, and for a fishery all three reduce
to derivatives of the catch. Profit is the catch minus a linear cost, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`u = y - cB`}),`, so
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B u = \\partial_B y - c`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_s u = \\partial_s y`}),`. The stock loses exactly what
is landed, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma = s + g(s) - y`}),`, so `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B \\sigma = -\\partial_B y`}),` — which at the myopic
optimum, where `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B y = c`}),`, is exactly `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-c`}),`. One more boat costs the stock precisely `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c`}),`
worth of fish, and the general correction becomes `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c\\,\\partial_s y / \\partial_{BB} y`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`Here they are.`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`ingredient`}),(0,t.jsx)(n.th,{children:`general`}),(0,t.jsxs)(n.th,{children:[`for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y = q s\\sqrt{B}`})]}),(0,t.jsx)(n.th,{children:`value`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`myopic rule`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_B y = c`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`q s / 2\\sqrt{B} = c`})}),(0,t.jsx)(n.td,{children:`—`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`myopic fleet`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B^{(0)}(s)`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left(q s / 2c\\right)^{2}`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`16 boats`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`myopic profit`}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y - cB`}),` at `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B^{(0)}`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`q^{2} s^{2} / 4c`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`2.00`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`value of a fish`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_s y`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`q^{2} s / 2c`})}),(0,t.jsxs)(n.td,{children:[`0.0395 at `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_1`})]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsxs)(n.td,{children:[`curvature `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\big(\\partial_{BB} u\\big)_0`})]}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\partial_{BB}\\, y`}),` at `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B^{(0)}`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-2c^{3} / q^{2} s^{2}`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-0.0039`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsxs)(n.strong,{children:[`correction `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`B_0^{(1)}`})]})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c\\,\\partial_s y / \\partial_{BB} y`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-q^{4} s_0^{2} s_1^{(0)} / 4c^{3}`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\mathbf{-1.263}`})})]})]})]}),`
`,(0,t.jsxs)(n.p,{children:[`The zeroth order is the 16 boats and 2.00 promised at the start. One season of that fleet lands
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y_0 = 4.00`}),` and leaves `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_1^{(0)} = 98.7`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Notice what is missing from that last row. `,(0,t.jsx)(n.strong,{children:`The renewal function never appears.`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`g`}),` enters the
correction only by setting what `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_1^{(0)}`}),` is, and nowhere else. It is tempting to assume a
patient planner is one who fishes below the growth rate; it is not. The planner is buying `,(0,t.jsx)(n.em,{children:`stock`}),`,
not `,(0,t.jsx)(n.em,{children:`growth`}),` — a fuller sea is cheaper to fish next season, and that is the whole mechanism.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The curvature explains the size of the effect: `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`-0.0039`}),` is a very flat peak, so a small price on
fish slides the fleet a long way. Concretely, it comes off the impatient 16 boats by about eight
percent per unit of patience.`]}),`
`,(0,t.jsx)(n.h3,{children:`Where the fishery ends up`}),`
`,(0,t.jsx)(n.p,{children:`The expansion says which way the fleet moves; it says nothing about where the fishery settles. That
was Sustainability's question, and for this fishery the two ends of the patience range are very far
apart:`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{}),(0,t.jsxs)(n.th,{children:[`myopic, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta = 0`})]}),(0,t.jsxs)(n.th,{children:[`far-sighted, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta \\to 1`})]})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`stock`}),(0,t.jsx)(n.td,{children:`69.8`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`518`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`boats`}),(0,t.jsx)(n.td,{children:`7.79`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`2.09`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`catch`}),(0,t.jsx)(n.td,{children:`1.95`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`7.49`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`profit`}),(0,t.jsx)(n.td,{children:`0.97`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`7.23`})})]})]})]}),`
`,(0,t.jsx)(n.p,{children:`A quarter of the boats landing four times the fish, on a sea seven times fuller. That is what
patience buys here, and it is not austerity — a fuller sea is cheaper to work, so more stock and
more catch arrive together.`}),`
`,(0,t.jsxs)(n.p,{children:[`Solving the dynamic problem numerically shows the fishery walking there as `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),` rises: starting
from `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`s_0 = 100`}),`, the long-run stock comes out at 69.7, 89.7, 375.9 and 503.2 for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta = 0`}),`,
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`0.9`}),`, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`0.99`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`0.999`}),`. Almost all of that journey happens in the last stretch of the patience
range — which is exactly the ground a small-`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\beta`}),` expansion cannot cover.`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};