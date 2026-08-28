import{t as e}from"./chunk-CRAtDASX.js";var t=e(),n=`/assets/static/qml_104_4_0.DgbqdSI4.png`,r=`/assets/static/qml_104_6_0.UJQKFyHb.png`,i=`/assets/static/qml_104_9_0.CF13-MJl.png`,a=`/assets/static/qml_104_12_2.Do52PzpE.png`,o=`/assets/static/qml_104_20_2.D6RlcZsJ.png`,s=`/assets/static/qml_104_25_2.DcdVwVXP.png`,c={author:[`fretchen`],order:4,title:`QML 104 - More is different ? Working with multiple qubits`};function l(e){let c={a:`a`,annotation:`annotation`,code:`code`,h2:`h2`,img:`img`,li:`li`,math:`math`,mi:`mi`,mn:`mn`,mo:`mo`,mrow:`mrow`,msub:`msub`,msup:`msup`,ol:`ol`,p:`p`,pre:`pre`,semantics:`semantics`,span:`span`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(c.p,{children:[`In the `,(0,t.jsx)(c.a,{href:`./3`,children:`previous tutorial`}),` we saw how we might be able to handle more complex inputs through reuploading. However, we only discussed algorithms with single qubits until now and there is little chance that such algorithms have an impact beyond their pedagogical power.`]}),`
`,(0,t.jsx)(c.p,{children:`In this tutorial, we will present one for to introduce multiple qubits and entangle them. We will learn:`}),`
`,(0,t.jsxs)(c.ul,{children:[`
`,(0,t.jsx)(c.li,{children:`How multiple qubits can work with multiple labels.`}),`
`,(0,t.jsx)(c.li,{children:`Entanglement might be used to control the performance of the circuit.`}),`
`]}),`
`,(0,t.jsx)(c.p,{children:`We will always focus on simplicity throughout this tutorial and leave the more complex discussions to the extensive literature.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`from typing import Union, List

import numpy as np
import matplotlib.pyplot as plt

from tqdm import tqdm

# for splitting the data set
from sklearn.model_selection import train_test_split

# for the quantum circuits
from qiskit.circuit import QuantumCircuit, Parameter
from qiskit import Aer
`})}),`
`,(0,t.jsx)(c.h2,{children:`A multi-label data set`}),`
`,(0,t.jsxs)(c.p,{children:[`In the `,(0,t.jsx)(c.a,{href:`./1`,children:`first tutorials`}),` we saw how to label data that depend only on one input and had binary labels `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`y`}),(0,t.jsx)(c.mi,{children:`i`})]}),(0,t.jsx)(c.mo,{children:`∈`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`{`}),(0,t.jsx)(c.mn,{children:`0`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mn,{children:`1`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`}`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`y_i \\in \\{0, 1\\}`})]})})}),(0,t.jsxs)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.7335em`,verticalAlign:`-0.1944em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`y`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(c.span,{className:`mrel`,children:`∈`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(c.span,{className:`mopen`,children:`{`}),(0,t.jsx)(c.span,{className:`mord`,children:`0`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`1`}),(0,t.jsx)(c.span,{className:`mclose`,children:`}`})]})]})]}),`. In the `,(0,t.jsx)(c.a,{href:`./3`,children:`third tutorial`}),`, we worked with a data set that had a two-dimensional input `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{mathvariant:`bold`,children:`x`}),(0,t.jsx)(c.mi,{children:`i`})]}),(0,t.jsx)(c.mo,{children:`=`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`(`}),(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`x`}),(0,t.jsxs)(c.mrow,{children:[(0,t.jsx)(c.mn,{children:`1`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mi,{children:`i`})]})]}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`x`}),(0,t.jsxs)(c.mrow,{children:[(0,t.jsx)(c.mn,{children:`2`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mi,{children:`i`})]})]}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`\\mathbf{x}_i = (x_{1,i}, x_{2,i})`})]})})}),(0,t.jsxs)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.5944em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathbf`,children:`x`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(c.span,{className:`mrel`,children:`=`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1.0361em`,verticalAlign:`-0.2861em`}}),(0,t.jsx)(c.span,{className:`mopen`,children:`(`}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(c.span,{className:`mord mtight`,children:[(0,t.jsx)(c.span,{className:`mord mtight`,children:`1`}),(0,t.jsx)(c.span,{className:`mpunct mtight`,children:`,`}),(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})]})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.2861em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(c.span,{className:`mord mtight`,children:[(0,t.jsx)(c.span,{className:`mord mtight`,children:`2`}),(0,t.jsx)(c.span,{className:`mpunct mtight`,children:`,`}),(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})]})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.2861em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mclose`,children:`)`})]})]})]}),` and a binary label `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`y`}),(0,t.jsx)(c.mi,{children:`i`})]}),(0,t.jsx)(c.mo,{children:`∈`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`{`}),(0,t.jsx)(c.mn,{children:`0`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mn,{children:`1`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`}`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`y_i \\in \\{0, 1\\}`})]})})}),(0,t.jsxs)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.7335em`,verticalAlign:`-0.1944em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`y`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(c.span,{className:`mrel`,children:`∈`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(c.span,{className:`mopen`,children:`{`}),(0,t.jsx)(c.span,{className:`mord`,children:`0`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`1`}),(0,t.jsx)(c.span,{className:`mclose`,children:`}`})]})]})]}),`. We will now build up on this work and use a data set that has:`]}),`
`,(0,t.jsxs)(c.ul,{children:[`
`,(0,t.jsxs)(c.li,{children:[`one dimensional input `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsx)(c.mi,{children:`x`})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`x`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.4306em`}}),(0,t.jsx)(c.span,{className:`mord mathnormal`,children:`x`})]})})]}),`.`]}),`
`,(0,t.jsxs)(c.li,{children:[`Labels that go from `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`y`}),(0,t.jsx)(c.mi,{children:`i`})]}),(0,t.jsx)(c.mo,{children:`∈`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`{`}),(0,t.jsx)(c.mn,{children:`0`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mn,{children:`1`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mn,{children:`2`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsx)(c.mn,{children:`3`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`}`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`y_i \\in \\{0, 1, 2, 3\\}`})]})})}),(0,t.jsxs)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.7335em`,verticalAlign:`-0.1944em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`y`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(c.span,{className:`mrel`,children:`∈`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(c.span,{className:`mopen`,children:`{`}),(0,t.jsx)(c.span,{className:`mord`,children:`0`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`1`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`2`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`3`}),(0,t.jsx)(c.span,{className:`mclose`,children:`}`})]})]})]}),`. Extending our previous data set.`]}),`
`]}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`np.random.seed(1)
xdata = np.random.uniform(0, 2, 100)
ydata = np.ceil(2*xdata)-1

f, ax = plt.subplots()
ax.plot(xdata, ydata, "o")
ax.set_xlabel("input value")
ax.set_ylabel("label");
`})}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:n,alt:`png`})}),`
`,(0,t.jsx)(c.p,{children:`Once again we split the data set and get into the training.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`x_train, x_test, y_train, y_test = train_test_split(
    xdata, ydata, test_size=0.20, random_state=42
)


f, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5), sharex=True, sharey=True)
ax1.plot(x_train, y_train, "o")
ax1.set_xlabel("input value")
ax1.set_ylabel(" given labels")
ax1.set_title("training data")

ax2.plot(x_test, y_test, "o")
ax2.set_xlabel("input value")
ax2.set_title("test data")

f.tight_layout()
`})}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:r,alt:`png`})}),`
`,(0,t.jsx)(c.h2,{children:`Handling multiple labels`}),`
`,(0,t.jsxs)(c.p,{children:[`To achieve training now, we have to handle labels that go beyond binary. Quite interestingly there is a multitude of approaches on how to encode such labels, one of them was propose in the original paper `,(0,t.jsx)(c.a,{href:`https://quantum-journal.org/papers/q-2020-02-06-226/`,children:`data-reuploading approach`}),`. However, we will follow a more intuitive path in which we simply use the qubits as `,(0,t.jsx)(c.a,{href:`https://en.wikipedia.org/wiki/Binary_number`,children:`binary encoding`}),` of the labels. To represent the number `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsx)(c.mn,{children:`3`})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`3`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.6444em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`3`})]})})]}),`, we therefore need two qubits as the result `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsx)(c.mi,{mathvariant:`normal`,children:`∣`}),(0,t.jsx)(c.mn,{children:`11`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`⟩`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`|11\\rangle`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`∣11`}),(0,t.jsx)(c.span,{className:`mclose`,children:`⟩`})]})})]}),` is then translated in `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsxs)(c.msup,{children:[(0,t.jsx)(c.mn,{children:`2`}),(0,t.jsx)(c.mn,{children:`1`})]}),(0,t.jsx)(c.mo,{children:`+`}),(0,t.jsxs)(c.msup,{children:[(0,t.jsx)(c.mn,{children:`1`}),(0,t.jsx)(c.mn,{children:`1`})]}),(0,t.jsx)(c.mo,{children:`=`}),(0,t.jsx)(c.mn,{children:`3`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`2^1+1^1 = 3`})]})})}),(0,t.jsxs)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8974em`,verticalAlign:`-0.0833em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord`,children:`2`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsx)(c.span,{className:`vlist-t`,children:(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.8141em`},children:(0,t.jsxs)(c.span,{style:{top:`-3.063em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mtight`,children:`1`})})]})})})})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2222em`}}),(0,t.jsx)(c.span,{className:`mbin`,children:`+`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2222em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8141em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord`,children:`1`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsx)(c.span,{className:`vlist-t`,children:(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.8141em`},children:(0,t.jsxs)(c.span,{style:{top:`-3.063em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mtight`,children:`1`})})]})})})})})]}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(c.span,{className:`mrel`,children:`=`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.6444em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`3`})]})]})]}),`. In summary, we will`]}),`
`,(0,t.jsxs)(c.ol,{children:[`
`,(0,t.jsxs)(c.li,{children:[`Prepare the initial state, where multiple qubits are initialized in `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsx)(c.mn,{children:`0`})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`0`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.6444em`}}),(0,t.jsx)(c.span,{className:`mord`,children:`0`})]})})]}),`.`]}),`
`,(0,t.jsxs)(c.li,{children:[`Apply a parametrized circuit with parameters `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsx)(c.mi,{mathvariant:`bold`,children:`w`})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`\\mathbf{w}`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.4444em`}}),(0,t.jsx)(c.span,{className:`mord mathbf`,style:{marginRight:`0.016em`},children:`w`})]})})]}),` that depend on the input `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsxs)(c.mrow,{children:[(0,t.jsx)(c.mi,{children:`U`}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(c.mi,{mathvariant:`bold`,children:`w`}),(0,t.jsx)(c.mo,{separator:`true`,children:`,`}),(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`x`}),(0,t.jsx)(c.mi,{children:`i`})]}),(0,t.jsx)(c.mo,{stretchy:`false`,children:`)`})]}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`U(\\mathbf{w},x_i)`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.109em`},children:`U`}),(0,t.jsx)(c.span,{className:`mopen`,children:`(`}),(0,t.jsx)(c.span,{className:`mord mathbf`,style:{marginRight:`0.016em`},children:`w`}),(0,t.jsx)(c.span,{className:`mpunct`,children:`,`}),(0,t.jsx)(c.span,{className:`mspace`,style:{marginRight:`0.1667em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]}),(0,t.jsx)(c.span,{className:`mclose`,children:`)`})]})})]}),`.`]}),`
`,(0,t.jsx)(c.li,{children:`Read out the label from the measurement of the qubit.`}),`
`]}),`
`,(0,t.jsxs)(c.p,{children:[`The main difference is now that we have multiple qubits that we should handle in this approach and we have to choose how to properly parametrize the circuit. This falls into the large class of variational circuits, about which we might do a series of tutorials, if interest exists. A nice review on different choices can be found `,(0,t.jsx)(c.a,{href:`https://arxiv.org/abs/2008.08605`,children:`in this paper`}),`. Here, we will choose the following parametrization.`]}),`
`,(0,t.jsxs)(c.ol,{children:[`
`,(0,t.jsxs)(c.li,{children:[`We apply a rotation gate `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`R`}),(0,t.jsx)(c.mi,{children:`x`})]})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`R_x`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8333em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0077em`},children:`R`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0077em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`x`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]})]})})]}),` on each qubit.`]}),`
`,(0,t.jsxs)(c.li,{children:[`We entangle the two qubit through a parametrized two qubit gate. A wide choice exists, but the `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`R`}),(0,t.jsxs)(c.mrow,{children:[(0,t.jsx)(c.mi,{children:`z`}),(0,t.jsx)(c.mi,{children:`z`})]})]})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`R_{zz}`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8333em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0077em`},children:`R`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0077em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(c.span,{className:`mord mtight`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.044em`},children:`z`}),(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.044em`},children:`z`})]})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]})]})})]}),` gate is especially nice as it creates entanglement and does not commute with the `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`R`}),(0,t.jsx)(c.mi,{children:`x`})]})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`R_x`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8333em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0077em`},children:`R`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0077em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`x`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]})]})})]}),` gates.`]}),`
`,(0,t.jsxs)(c.li,{children:[`We apply another rotation gate `,(0,t.jsxs)(c.span,{className:`katex`,children:[(0,t.jsx)(c.span,{className:`katex-mathml`,children:(0,t.jsx)(c.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(c.semantics,{children:[(0,t.jsx)(c.mrow,{children:(0,t.jsxs)(c.msub,{children:[(0,t.jsx)(c.mi,{children:`R`}),(0,t.jsx)(c.mi,{children:`x`})]})}),(0,t.jsx)(c.annotation,{encoding:`application/x-tex`,children:`R_x`})]})})}),(0,t.jsx)(c.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(c.span,{className:`base`,children:[(0,t.jsx)(c.span,{className:`strut`,style:{height:`0.8333em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(c.span,{className:`mord`,children:[(0,t.jsx)(c.span,{className:`mord mathnormal`,style:{marginRight:`0.0077em`},children:`R`}),(0,t.jsx)(c.span,{className:`msupsub`,children:(0,t.jsxs)(c.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(c.span,{className:`vlist-r`,children:[(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.1514em`},children:(0,t.jsxs)(c.span,{style:{top:`-2.55em`,marginLeft:`-0.0077em`,marginRight:`0.05em`},children:[(0,t.jsx)(c.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(c.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(c.span,{className:`mord mathnormal mtight`,children:`x`})})]})}),(0,t.jsx)(c.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(c.span,{className:`vlist-r`,children:(0,t.jsx)(c.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(c.span,{})})})]})})]})]})})]}),` on each qubit.`]}),`
`]}),`
`,(0,t.jsxs)(c.p,{children:[`Let us just visualize it once in `,(0,t.jsx)(c.code,{children:`qiskit`}),`.`]}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`sim = Aer.get_backend("aer_simulator")
`})}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`theta1 = Parameter(r"$\\theta_1$")
theta2 = Parameter(r"$\\theta_2$")

alpha0 = Parameter(r"$\\alpha_0$")

qc = QuantumCircuit(2)

# first upload
qc.rx(theta1, 0)
qc.rx(theta2, 1)

# first processing
qc.rzz(alpha0, 0,1)

# second upload
qc.rx(theta1, 0)
qc.rx(theta2, 1)


qc.measure_all()
qc.draw("mpl")
`})}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:i,alt:`png`})}),`
`,(0,t.jsx)(c.p,{children:`We can now look at the performance of the code with some randomly initialized weight in predicting the appropiate label.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`def get_accuracy(
    qc: QuantumCircuit, weights: List[float] , alphas: List[float], xvals: List[float], yvals: List[int]) -> Union[float, List[int]]:
    """
    Calculates the accuracy of the circuit for a given set of data.

    Args:
      qc: the quantum circuit
      alphas: the training parameters for the z processing gate
      gammas: the training parameters for the x processing gate
      weights: the weights for the inputs
      xvals: the input values
      yvals: the labels
    Returns:
      The accuracy and the predicted labels.
    """
    pred_labels = np.zeros(len(xvals))
    accurate_prediction = 0
    for ii, xinput, yinput in zip(range(len(xvals)), xvals, yvals.astype(int)):
        # set the circuit parameter
        circuit = qc.assign_parameters(
            {theta1: weights[0]*xinput,
             theta2: weights[1]*xinput,
             alpha0: alphas
             },
            inplace=False,
        )
        # run the job and obtain the counts
        Nshots = 4000
        job = sim.run(circuit, shots=Nshots)
        counts1 = job.result().get_counts()  # e.g. counts = {"00": 2000, "11": 2000}

        # obtain the predicted label on average
        av_label = 0
        for el in counts1:
          av_label += int(el,2)*counts1[el]/Nshots
        pred_label = round(av_label)

        pred_labels[ii] = pred_label
        if yinput == pred_label:
            accurate_prediction += 1
    return accurate_prediction / len(yvals), pred_labels
`})}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`np.random.seed(123)

weights = np.random.uniform(size=2)
alphas = np.random.uniform()


accuracy, y_pred = get_accuracy(qc, alphas=alphas, weights=weights, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

print(f"The randomly initialized circuit has an accuracy of {accuracy}")

f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()
`})}),`
`,(0,t.jsx)(c.p,{children:`The randomly initialized circuit has an accuracy of 0.275`}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:a,alt:`png`})}),`
`,(0,t.jsx)(c.h2,{children:`Training`}),`
`,(0,t.jsxs)(c.p,{children:[`We once again have to train the circuit as discussed in the`,(0,t.jsx)(c.a,{href:`./3`,children:` previous tutorial`}),` with `,(0,t.jsx)(c.a,{href:`https://docs.scipy.org/doc/scipy/reference/optimize.html`,children:(0,t.jsx)(c.code,{children:`scipy.optimize`})}),` package to optimize the target function.`]}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`from scipy.optimize import minimize
`})}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`def get_cost_for_circ(xvals, yvals, machine=sim):
    """
    Runs parametrized circuit

    Args:
        x: position of the dot
        y: its state label
        params: parameters of the circuit
    """

    def execute_circ(params_flat):
        weights = params_flat[:2]
        alphas = params_flat[2]
        accuracy, y_pred = get_accuracy(qc, alphas=alphas, weights=weights, xvals=xvals, yvals=yvals)
        print(f"accuracy = {accuracy}")
        return 1-accuracy

    return execute_circ
`})}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`total_cost = get_cost_for_circ(x_train, y_train, sim)

# initial parameters which are randomly initialized
np.random.seed(123)
params = np.random.uniform(size=3)
params_flat = params.flatten()

# params, which are guessed close to what we know to be a good result
params_flat = [0.9,0.9,0.7]

# minimze with COBYLA optimize, which often performs quite well
res = minimize(total_cost, params_flat, method="COBYLA")
`})}),`
`,(0,t.jsx)(c.p,{children:`accuracy = 0.975
accuracy = 0.6125
accuracy = 0.3125
accuracy = 0.375
accuracy = 0.2625
accuracy = 0.5375
accuracy = 0.8
accuracy = 0.8
accuracy = 0.75
accuracy = 0.9375
accuracy = 0.95
accuracy = 0.95
accuracy = 0.9625
accuracy = 0.975
accuracy = 0.975
accuracy = 0.9875
accuracy = 0.9625
accuracy = 0.95
accuracy = 0.975
accuracy = 0.9625
accuracy = 0.975
accuracy = 0.975
accuracy = 0.9875
accuracy = 0.9875
accuracy = 0.9625
accuracy = 0.95
accuracy = 0.9625
accuracy = 0.975
accuracy = 0.9625
accuracy = 0.975
accuracy = 0.975
accuracy = 0.975
accuracy = 0.975
accuracy = 0.975
accuracy = 0.975
accuracy = 0.9625
accuracy = 0.975`}),`
`,(0,t.jsx)(c.p,{children:`We can see that the accuracy is converging to a value of more than 95% and it is now time to look into the optimal training parameters.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`opt_weights = res.x[:2]
opt_alphas = res.x[2]

print(f"optimal weights = {opt_weights}")
print(f"optimal alpha = {opt_alphas}")
`})}),`
`,(0,t.jsx)(c.p,{children:`optimal weights = [0.9010178  0.90824815]
optimal alpha = 0.7131673355135238`}),`
`,(0,t.jsx)(c.p,{children:`We can now test the accuracy on the optimal value of the weights again to test the accuracy.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`accuracy, y_pred = get_accuracy(qc, weights=opt_weights, alphas = opt_alphas, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

print(f"The trained circuit has an accuracy of {accuracy:.2}")

f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()
`})}),`
`,(0,t.jsx)(c.p,{children:`The trained circuit has an accuracy of 0.96`}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:o,alt:`png`})}),`
`,(0,t.jsx)(c.p,{children:`We can see quite excellent training for this data set. One common question that always comes up for these kinds of circuits is also about the potential role of entanglement. The simplest thing would be to simply set the alpha parameter to zero.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`accuracy_wo_entanglement, _ = get_accuracy(qc, weights=opt_weights, alphas = 0, xvals=x_train, yvals=y_train)
print(f"The trained circuit without entanglement has an accuracy of {accuracy_wo_entanglement:.2}")
`})}),`
`,(0,t.jsx)(c.p,{children:`The trained circuit without entanglement has an accuracy of 0.79`}),`
`,(0,t.jsx)(c.p,{children:`We can see that the correlation between the two qubits plays and substantial role in the prediction of the labels. The training of the circuit without any kind of entanglement is left to the reader. Or you just send us a comment if you would like to have a cleaner introduction on this issue.`}),`
`,(0,t.jsx)(c.h2,{children:`Test`}),`
`,(0,t.jsx)(c.p,{children:`Having finished the training, we can test the circuit now on data points that it has never seen.`}),`
`,(0,t.jsx)(c.pre,{children:(0,t.jsx)(c.code,{className:`language-python`,children:`test_accuracy, y_test_pred = get_accuracy(
    qc, weights=opt_weights,  alphas = opt_alphas, xvals=x_test, yvals=y_test
)

false_label = abs(y_test_pred - y_test) > 0

x_false = x_test[false_label]
y_false = y_test_pred[false_label]

print(f"The circuit has a test accuracy of {test_accuracy:.2}")

f, ax = plt.subplots()
ax.plot(x_test, y_test_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()
`})}),`
`,(0,t.jsx)(c.p,{children:`The circuit has a test accuracy of 1.0`}),`
`,(0,t.jsx)(c.p,{children:(0,t.jsx)(c.img,{src:s,alt:`png`})}),`
`,(0,t.jsx)(c.h2,{children:`Summary and outlook`}),`
`,(0,t.jsx)(c.p,{children:`In this last tutorial of this introductory series, we have seen that the data reuploading can be extended towards multiple labels.`}),`
`,(0,t.jsxs)(c.ul,{children:[`
`,(0,t.jsx)(c.li,{children:`The crucial step was the extension to multiple qubits.`}),`
`,(0,t.jsx)(c.li,{children:`To make the algorithm work efficiently we entangled the qudits with an entanglement gate and then trained the full circuit with the whole data set.`}),`
`]}),`
`,(0,t.jsx)(c.p,{children:`Of course, we have not gone into complex data-sets like the MNIST or other problems in this series. This will be up to the more complex literature or more advanced courses. However, we hope that this series gave you a basic idea of some fairly common concepts that are used in the field nowadays.`})]})}function u(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}export{u as default,c as frontmatter};