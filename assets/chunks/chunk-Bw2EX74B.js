import{Cn as e}from"./chunk-Bzf2rILe.js";import{t}from"./chunk-oyhCWECb2.js";var n=e(),r=`/assets/static/lecture16_pic1.rA-XJF8w.png`,i=`/assets/static/lecture16_pic2.BxHoP_Bt.svg`,a=`/assets/static/lecture16_pic3.C5xui9iF.svg`,o=`/assets/static/lecture16_pic4.Cq4ZUNFw.png`,s=`/assets/static/lecture16_pic5.B5sQ_YMF.png`,c=`/assets/static/lecture16_pic6.BwCEqmpL.png`,l={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:16,title:`Lecture 16 - Molecular Orbitals of Diatomic Molecules`};function u(e){let l={a:`a`,code:`code`,del:`del`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(l.p,{children:`In this lecture we will discuss a systematic approach to build up
molecules from more complex atoms.`}),`
`,(0,n.jsx)(l.p,{children:`In the last lecture we discussed the existing orbits within
the linear combination of orbitals. We will now try to systematically
fill up the orbitals with electrons in order of their energy.`}),`
`,(0,n.jsx)(l.h1,{children:`Molecular bindings`}),`
`,(0,n.jsxs)(l.p,{children:[`A good overview over the different mechanism for molecular binding is
given in Fig. `,(0,n.jsx)(l.a,{href:`#fig-hydrogen-overview`,children:`1`}),`. In
the last lecture we have seen two different binding processes of
molecular bonding:`]}),`
`,(0,n.jsxs)(l.ol,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Ionic binding, which was important in the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`H_2^+`}),` molecule.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Kovalent binding, which dominated the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`H_2`}),` molecule.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`Both are important for small distances. For large distance the van der
Waals interaction can create weakly bound molecules.`}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-overview`,href:r,caption:`Different binding mechanisms in diatomic molecules`}),`
`,(0,n.jsx)(l.h1,{children:`Van-der Vaals interaction`}),`
`,(0,n.jsx)(l.p,{children:`The question is then how can these systems interact ? They do not share
electrons and they are neutral, so they do not have a permanent electric
dipole moment. The magnetic dipole interaction is extremely weak anyway.`}),`
`,(0,n.jsxs)(l.p,{children:[`The key is induced dipole moment of the atom in in an electric field,
seen in lecture 6. Each of the atoms can have a dipole
moment `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathbf{D}_i = q \\mathbf{r}_i`}),`. As each atom is neutral, they
interact through their dipole-dipole interaction:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`
\\hat{W}_{dd} =\\frac{1}{4\\pi \\epsilon_0}\\frac{e^2}{R^3}\\left(\\mathbf{r}_A\\cdot \\mathbf{r}_B-3(\\mathbf{r}_A\\cdot \\mathbf{n})(\\mathbf{r}_B\\cdot \\mathbf{n})\\right)`})}),`
`,(0,n.jsxs)(l.p,{children:[`We now have to perform the amplitude of this energy
quantum mechanically. In a first step, we express `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{W}_{dd}`}),` in
terms of the operators `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{X}_{A,B}, \\hat{Y}_{A,B}, \\hat{Z}_{A,B}`}),`.
The orientation of the atom is sketched in the inset in Fig.
`,(0,n.jsx)(l.a,{href:`#fig-two-atoms`,children:`2`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-two-atoms`,href:i,caption:`Configuration of two dipoles`}),`
`,(0,n.jsx)(l.p,{children:`We can write then:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{W}_{dd} =\\frac{1}{4\\pi \\epsilon_0}\\frac{e^2}{R^3}\\left(\\hat{X}_A \\hat{X}_B + \\hat{Y}_A\\hat{Y}_B - 2 \\hat{Z}_A \\hat{Z}_B\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`We are only interested in their interaction at very large distances,
such that we can treat the interaction perturbatively (see lecture 7). To first order, we have to evaluate:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`E_1 = \\left\\langle\\phi_{n,0,0^A, \\phi_{n,0,0}^B}\\right| \\hat{W}_{dd}
\\left|\\phi_{n,0,0^A, \\phi_{n,0,0}^B}\\right\\rangle`})}),`
`,(0,n.jsxs)(l.p,{children:[`It only contains terms of the kind
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left\\langle\\phi_{n,0,0^i}\\right| \\hat{X}_i \\left|\\phi_{n,0,0^i}\\right\\rangle`}),`.
As the dipole moment is zero, the first order correction in the energy
is zero too. The idea is then that the mean electric field created by
the atom might be zero. However, quantum mechanics allows for
fluctuations of the type `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\langle |e\\mathbf{r}|^2\\rangle`}),`. They are
taken into account through second order perturbation theory. We obtain
directly:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`E_2 = \\sum_{\\phi,\\phi'} \\frac{|\\left\\langle\\psi_{\\phi^A,\\psi_{\\phi'}^B}\\right|\\hat{W}_{dd}\\left|\\psi_{0^A,\\psi_{0}^B}\\right\\rangle|^2}{(E_{0}^A+E_0^B -E_\\phi^A -E_{\\phi'}^B)}`})}),`
`,(0,n.jsxs)(l.p,{children:[`And we can also pull out the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`R^3`}),` dependence of each
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`W`}),`, to obtain a general expression for the `,(0,n.jsx)(l.strong,{children:`van-der-Waals
interaction`}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`E_2 = - \\frac{C_6}{R^6}`})}),`
`,(0,n.jsxs)(l.p,{children:[`To get an estimate for the typical scale of the binding we can have a
look into the prefactor `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`C_6`}),`. We will do this here for highly excited
states of hydrogen as it is relevant to the other alkalis too:`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Each `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{X}`}),` will be be proportional to the typical extension of
its orbit, such that we have `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{X} \\sim n^2 a_0`}),` within the
electronic shells.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`As for the energy difference, we know that the energy of high `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),`
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`E_n \\approx \\frac{ R_{y,\\infty}}{n^2}`}),` (the screening makes all
alkalis look very similiar for high energies). The energy difference
is therefore in the order of
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\delta E_n \\approx \\frac{ R_{y,\\infty}}{n^3}`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`Putting it all together, we obtain`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`C_6 \\approx \\frac{e^4 a_0^4 n^8}{R_{y,\\infty}/n^3} \\approx \\frac{e^4 a_0^4}{R_{y,\\infty} (4\\pi\\epsilon_0)^2} n^{11}`})}),`
`,(0,n.jsxs)(l.p,{children:[`This prediction has been directly tested as shown in Fig. `,(0,n.jsx)(l.a,{href:`#fig-beguin`,children:`3`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-beguin`,href:a,caption:`Direct measurement of the van-der-Waals force`}),`
`,(0,n.jsx)(l.h1,{children:`Molecular orbit theory`}),`
`,(0,n.jsx)(l.p,{children:`We would like to put together more complex molecules step-by-step. Let's
take a step back to the hydrogen molecule to formulate the problem.`}),`
`,(0,n.jsx)(l.h2,{children:`The hydrogen molecule`}),`
`,(0,n.jsxs)(l.p,{children:[`Let us have a brief look at H`,(0,n.jsx)(l.del,{children:`2`}),` again and consider only contributions
from `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1s`}),` atomic orbitals. We saw that we can distribute the two
electrons within the gerade and ungerade orbital of the hydrogen ion. So
our basic orbitals will be:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\sigma_g \\propto \\left( \\psi_{1s} (\\vec{r}_\\textrm{a}) + \\psi_{1s} (\\vec{r}_\\textrm{b}) \\right)`})}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\sigma_u \\propto \\left( \\psi_{1s} (\\vec{r}_\\textrm{a}) - \\psi_{1s} (\\vec{r}_\\textrm{b}) \\right).`})}),`
`,(0,n.jsx)(l.p,{children:`Lower case letters stand for the individual electrons
while upper case letters characterize the whole system. We will now
attempt to fill up the two orbitals with the two electrons:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Both electrons in a gerade orbital `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_g^{2}`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Both electrons in an ungerade orbital `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_u^{2}`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`One electron in a gerade orbtial and one electron in an ungerade
orbital: `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\sigma_g^{1}1\\sigma_u^{1}`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`In a second step, we need to respect the Pauli principle for the two
electrons, which states that the full wavefunction should be
anti-symmetric under exchange of particles. We had a detailled
discussion of the topic on helium. So for the first
configuration `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_g^{2}`}),` we have:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_1 \\propto \\sigma_g(1) \\cdot \\sigma_g(2) \\qquad (S=0, ^1\\Sigma_g)`})}),`
`,(0,n.jsxs)(l.p,{children:[`The spin has to be in a singlet here as the wavefunction
itself is symmetric. Further, the parity of the full wavefunction is
gerade as `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`g \\times g = g`}),`. So `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_1`}),` is in a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^1\\Sigma_g`}),`
configuration.`]}),`
`,(0,n.jsxs)(l.p,{children:[`As one atom is in `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_g^{1}`}),` and the other one is in
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_u^{1}`}),`, the parity of the full wavefunction is `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`g\\times u = u`}),`.
Additionally, we can choose which atom to position in which orbital and
then also the symmetry of the superposition. The symmetric superposition
is:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_{2} \\propto \\left (\\sigma_g(1) \\cdot \\sigma_u(2) + \\sigma_u(1) \\cdot \\sigma_u(2)\\right) \\quad \\qquad (S=0, ^1\\Sigma_u)`})}),`
`,(0,n.jsxs)(l.p,{children:[`As the orbital superposition is symmetric, we once again
have work in a spin singlet to achieve the overall anti-symmetry of the
two-electron wavefunction. So `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_2`}),` is in a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^1\\Sigma_u`}),`
configuration.`]}),`
`,(0,n.jsx)(l.p,{children:`We can also choose anti-symmetric superposition of the two
distinguishable orbitals:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_3 \\propto \\left( \\sigma_g(1)\\cdot \\sigma_u(2)-\\sigma_u(1) \\cdot \\sigma_g(2) \\right) \\qquad (S=1, ^3\\Sigma_u)`})}),`
`,(0,n.jsxs)(l.p,{children:[`As the orbital superposition is anti-symmetric, we have
work in a spin triplet to achieve the overall anti-symmetry of the
two-electron wavefunction. So `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_3`}),` is in a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^3\\Sigma_u`}),`
configuration.`]}),`
`,(0,n.jsxs)(l.p,{children:[`And finally we have for `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1\\sigma_u^{2}`}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_4 \\propto \\sigma_u(1)\\cdot \\sigma_u(2) \\qquad (S=0, ^1\\Sigma_g)`})}),`
`,(0,n.jsxs)(l.p,{children:[`The spin has to be in a singlet here as the wavefunction
itself is symmetric. Further, the parity of the full wavefunction is
gerade as `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`u \\times u = g`}),`. So `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_4`}),` is in a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^1\\Sigma_g`}),`
configuration.`]}),`
`,(0,n.jsxs)(l.p,{children:[`At short distance the energy ordering is
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`E(\\psi_1) < E(\\psi_2) \\sim E(\\psi_3) < E(\\psi_4)`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-orbital-repulsion`,href:o,caption:`Molecular orbital energy levels with repulsion`}),`
`,(0,n.jsxs)(l.p,{children:[`In the figure above the faded lines indicate how the energy
of\xA0`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_1`}),` and\xA0`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_4`}),` would naively. If the system is diagonalized in
a more flexible basis, that allows for superpositions, the orbits repel.
Taken from\xA0`,(0,n.jsx)(l.a,{href:`https://global.oup.com/academic/product/molecular-quantum-mechanics-9780199541423`,children:`here`}),`.`]}),`
`,(0,n.jsxs)(l.p,{children:[`However for larger distances the gerade or ungerade character of each
wave function becomes of less importance and the two configurations
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_1`}),` and `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_4`}),` become of similiar energy. They are further both
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^1\\Sigma_g`}),` states. Therefore also all linear combinations of the two
states have the valid symmetries and and more flexibel trial solution
would be of the form:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`c_1 \\psi_1 + c_4 \\psi_4`})}),`
`,(0,n.jsx)(l.p,{children:`The full solution then shows clear level repulsion
between the two uncoupled channels. This concept is called
"configuration interaction".`}),`
`,(0,n.jsx)(l.h2,{children:`Conditions for (anti-)binding of particular orbitals.`}),`
`,(0,n.jsxs)(l.p,{children:[`The conditions for the creating of (anti-)binding orbitals is viusalized
in Fig `,(0,n.jsx)(l.a,{href:`#fig-binding`,children:`5`}),`.`]}),`
`,(0,n.jsx)(l.p,{children:`In a first step, there has to be sufficient wave function overlap, such
that there can be constructive and destructive interference. This
implies that the orbit has to be large enough to 'see' the other atom,
but not to diffuse. This typically implies that only the valence shell
has to be considered.`}),`
`,(0,n.jsxs)(l.p,{children:[`Only orbits of the same symmetry group can form a bond. The main
symmetry property here is the total `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`L_z`}),` with respect to the axis of
the molecule. We have `,(0,n.jsx)(l.a,{href:`https://global.oup.com/academic/product/molecular-quantum-mechanics-9780199541423`,children:`table 4.5 of Demtröder_2010`}),`:`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`s`}),`, `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`p_z`}),` and `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`d_{z^2}`}),` have `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`L_z = 0`}),` (`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Sigma`}),`).`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`p_x`}),`, `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`p_y`}),` as well as `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`d_{yz}`}),`, `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`d_{zx}`}),` have `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`|L_z| = 1`}),`(`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Pi`}),`)`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`Having a sufficient overlap is obviously not enough, the two orbits also
have to have the same a similiar energy, which is easily fulfilled in a
homonuclear molecule. But if we now have two different molecules the
orbital energy of (A) might be different from the orbital energy of (B).
The larger the difference, the smaller is the shift.`}),`
`,(0,n.jsx)(t,{id:`fig-binding`,href:s,caption:`Molecular orbitals of homonuclear and heteronuclear molecules`}),`
`,(0,n.jsx)(l.h1,{children:`Homo-nuclear shell structure`}),`
`,(0,n.jsxs)(l.p,{children:[`We can finally put all this together to build up the shell structure of
homo-cuclear diatomic molecules as shown in Fig.
`,(0,n.jsx)(l.a,{href:`#fig-homo`,children:`6`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-homo`,href:c,caption:`The shell structure of homonuclear diatomic molecules`}),`
`,(0,n.jsxs)(l.p,{children:[`The name of the molecule indicates the highest occupied molecular orbit
(`,(0,n.jsx)(l.em,{children:`HOMO`}),`). The next empty shell is then called the lowest occupied
molecular orbit (`,(0,n.jsx)(l.em,{children:`LUMO`}),`).`]})]})}function d(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}export{d as default,l as frontmatter};