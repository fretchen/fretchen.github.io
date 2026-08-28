import{t as e}from"./chunk-CRAtDASX.js";var t=e(),n=`/assets/static/qml_001_3_0.CJzDrZhv.png`,r=`/assets/static/qml_001_6_1.Y1-qPfo-.png`,i=`/assets/static/qml_001_8_0.CExh04f9.png`,a=`/assets/static/qml_001_12_2.Uyr908M3.png`,o=`/assets/static/qml_001_16_1.BWW2RXCE.png`,s=`/assets/static/qml_001_18_1.co4c7_ML.png`,c=`/assets/static/qml_001_20_1.Dd2CwEd0.png`,l={author:[`fretchen`],order:0,title:`QML 001 - A summary of classical supervised learning`};function u(e){let l={a:`a`,annotation:`annotation`,code:`code`,em:`em`,h2:`h2`,img:`img`,li:`li`,math:`math`,mfrac:`mfrac`,mi:`mi`,mn:`mn`,mo:`mo`,mrow:`mrow`,msub:`msub`,msup:`msup`,p:`p`,pre:`pre`,semantics:`semantics`,span:`span`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(l.p,{children:`In this tutorial, we will discuss some basic ideas behind classical supervised learning before we jump into the quantum part.`}),`
`,(0,t.jsx)(l.p,{children:`The notebook is structured as follows:`}),`
`,(0,t.jsxs)(l.ul,{children:[`
`,(0,t.jsxs)(l.li,{children:[`We introduce the learning task of classifying data points `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsxs)(l.msub,{children:[(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mi,{children:`i`})]})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`x_i`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.5806em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`msupsub`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(l.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(l.span,{})})})]})})]})]})})]}),` with labels `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsxs)(l.msub,{children:[(0,t.jsx)(l.mi,{children:`y`}),(0,t.jsx)(l.mi,{children:`i`})]})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`y_i`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.625em`,verticalAlign:`-0.1944em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`y`}),(0,t.jsx)(l.span,{className:`msupsub`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(l.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(l.span,{})})})]})})]})]})})]})]}),`
`,(0,t.jsx)(l.li,{children:`We introduce simple classification through logistic regression with bias and weight.`}),`
`,(0,t.jsx)(l.li,{children:`We provide simple training`}),`
`,(0,t.jsx)(l.li,{children:`We test the performance of the circuit.`}),`
`]}),`
`,(0,t.jsxs)(l.p,{children:[`We will always focus on simplicity throughout this tutorial and leave the more complex discussions to the extensive literature. So readers thank think "yet another tutorial on logistic regression", can most likely directly jump to the very `,(0,t.jsx)(l.a,{href:`qml101`,children:`first tutorial`}),` on quantum machine learning.`]}),`
`,(0,t.jsx)(l.h2,{children:`A simple learning task`}),`
`,(0,t.jsx)(l.p,{children:`For simplicity we will start out with a simple problem, where each data set has only a single variable and extend it later to higher dimensional data sets.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`from typing import Union, List

import numpy as np
import matplotlib.pyplot as plt

from tqdm import tqdm

`})}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`np.random.seed(1)
x = np.random.uniform(-np.pi, np.pi, 100)
y = 1.0* (x <  1)

f, ax = plt.subplots()
ax.plot(x, y, "o")
ax.set_xlabel(r"input value $x_i$");
ax.set_ylabel(r"label $y_i$");
`})}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:n,alt:`png`})}),`
`,(0,t.jsxs)(l.p,{children:[`The learning task is now to predict the label `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsxs)(l.msub,{children:[(0,t.jsx)(l.mi,{children:`y`}),(0,t.jsx)(l.mi,{children:`i`})]})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`y_i`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.625em`,verticalAlign:`-0.1944em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord mathnormal`,style:{marginRight:`0.0359em`},children:`y`}),(0,t.jsx)(l.span,{className:`msupsub`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(l.span,{style:{top:`-2.55em`,marginLeft:`-0.0359em`,marginRight:`0.05em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(l.span,{})})})]})})]})]})})]}),` from the input value `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsxs)(l.msub,{children:[(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mi,{children:`i`})]})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`x_i`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.5806em`,verticalAlign:`-0.15em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`msupsub`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.3117em`},children:(0,t.jsxs)(l.span,{style:{top:`-2.55em`,marginLeft:`0em`,marginRight:`0.05em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`i`})})]})}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.15em`},children:(0,t.jsx)(l.span,{})})})]})})]})]})})]}),`. To get started we have to divide the data set into a training part and a test part:`]}),`
`,(0,t.jsxs)(l.ul,{children:[`
`,(0,t.jsxs)(l.li,{children:[`On the `,(0,t.jsx)(l.em,{children:`training set`}),` we will optimize the algorithm to achieve the highest possible accuracy in predicting the label.`]}),`
`,(0,t.jsxs)(l.li,{children:[`On the `,(0,t.jsx)(l.em,{children:`test set`}),` we will test the performance of the algorithm with data it has never seen.`]}),`
`]}),`
`,(0,t.jsx)(l.p,{children:`The usual problem is here to find a good balance between a sufficient amount of training data, yet leaving enough test data to have a statistically significant test.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`from sklearn.model_selection import train_test_split
`})}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.20, random_state=42
)

f, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5), sharex=True, sharey=True)
ax1.plot(x_train, y_train, "o")
ax1.set_xlabel("input value")
ax1.set_ylabel(" given labels")
ax1.set_title("training data")

ax2.plot(x_test, y_test, "o")
ax2.set_xlabel("input value")
ax2.set_title("test data")
`})}),`
`,(0,t.jsx)(l.p,{children:`Text(0.5, 1.0, 'test data')`}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:r,alt:`png`})}),`
`,(0,t.jsx)(l.h2,{children:`Logistice regression as a minimal algorithm`}),`
`,(0,t.jsxs)(l.p,{children:[`It is now time to set up the algorithm for the training. We will use `,(0,t.jsx)(l.a,{href:`https://en.wikipedia.org/wiki/Logistic_regression`,children:`logistic regression`}),`, despite the fact that this horse has been ridden to death. It is has just all the right ingredients that are necessary to agree on basic concepts and notations. The logistic function itself is defined as:`]}),`
`,(0,t.jsx)(l.span,{className:`katex-display`,children:(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,display:`block`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mi,{children:`p`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(l.mo,{children:`=`}),(0,t.jsxs)(l.mfrac,{children:[(0,t.jsx)(l.mn,{children:`1`}),(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mn,{children:`1`}),(0,t.jsx)(l.mo,{children:`+`}),(0,t.jsxs)(l.msup,{children:[(0,t.jsx)(l.mi,{children:`e`}),(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mo,{children:`−`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(l.mi,{children:`W`}),(0,t.jsx)(l.mo,{children:`⋅`}),(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{children:`+`}),(0,t.jsx)(l.mi,{children:`b`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`)`})]})]})]})]})]}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`p(x) = \\frac{1}{1+e^{-(W\\cdot x+b)}}`})]})})}),(0,t.jsxs)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`p`}),(0,t.jsx)(l.span,{className:`mopen`,children:`(`}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`mclose`,children:`)`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(l.span,{className:`mrel`,children:`=`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`2.1088em`,verticalAlign:`-0.7873em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mopen nulldelimiter`}),(0,t.jsx)(l.span,{className:`mfrac`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsxs)(l.span,{className:`vlist`,style:{height:`1.3214em`},children:[(0,t.jsxs)(l.span,{style:{top:`-2.296em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord`,children:`1`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2222em`}}),(0,t.jsx)(l.span,{className:`mbin`,children:`+`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2222em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`e`}),(0,t.jsx)(l.span,{className:`msupsub`,children:(0,t.jsx)(l.span,{className:`vlist-t`,children:(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.814em`},children:(0,t.jsxs)(l.span,{style:{top:`-2.989em`,marginRight:`0.05em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`2.7em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsxs)(l.span,{className:`mord mtight`,children:[(0,t.jsx)(l.span,{className:`mord mtight`,children:`−`}),(0,t.jsx)(l.span,{className:`mopen mtight`,children:`(`}),(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,style:{marginRight:`0.1389em`},children:`W`}),(0,t.jsx)(l.span,{className:`mbin mtight`,children:`⋅`}),(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`x`}),(0,t.jsx)(l.span,{className:`mbin mtight`,children:`+`}),(0,t.jsx)(l.span,{className:`mord mathnormal mtight`,children:`b`}),(0,t.jsx)(l.span,{className:`mclose mtight`,children:`)`})]})})]})})})})})]})]})]}),(0,t.jsxs)(l.span,{style:{top:`-3.23em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`frac-line`,style:{borderBottomWidth:`0.04em`}})]}),(0,t.jsxs)(l.span,{style:{top:`-3.677em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`mord`,children:(0,t.jsx)(l.span,{className:`mord`,children:`1`})})]})]}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.7873em`},children:(0,t.jsx)(l.span,{})})})]})}),(0,t.jsx)(l.span,{className:`mclose nulldelimiter`})]})]})]})]})}),`
`,(0,t.jsx)(l.p,{children:`It has a number of useful properties for us:`}),`
`,(0,t.jsxs)(l.ul,{children:[`
`,(0,t.jsx)(l.li,{children:`It interpolates nicely between 0 and 1.`}),`
`,(0,t.jsxs)(l.li,{children:[`The value of the transition is set by the `,(0,t.jsx)(l.em,{children:`bias`}),` `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsx)(l.mi,{children:`b`})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`b`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6944em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`b`})]})})]}),`. For `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{children:`≫`}),(0,t.jsx)(l.mi,{children:`b`})]}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`x \\gg b`})]})})}),(0,t.jsxs)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.5782em`,verticalAlign:`-0.0391em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(l.span,{className:`mrel`,children:`≫`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6944em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`b`})]})]})]}),` the exponential goes to zero and `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mi,{children:`p`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(l.mo,{children:`→`}),(0,t.jsx)(l.mn,{children:`1`})]}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`p(x) \\rightarrow 1`})]})})}),(0,t.jsxs)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`p`}),(0,t.jsx)(l.span,{className:`mopen`,children:`(`}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`mclose`,children:`)`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(l.span,{className:`mrel`,children:`→`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6444em`}}),(0,t.jsx)(l.span,{className:`mord`,children:`1`})]})]})]}),`, while it goes to 0 for the other side.`]}),`
`,(0,t.jsxs)(l.li,{children:[`The sharpness of the transition is set by the weight `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsx)(l.mi,{children:`W`})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`W`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6833em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,style:{marginRight:`0.1389em`},children:`W`})]})})]}),`, which tells us how much of an influence we should attach to the input value `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsx)(l.mi,{children:`x`})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`x`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.4306em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`})]})})]}),`.`]}),`
`]}),`
`,(0,t.jsx)(l.p,{children:`Below you can find a general example of such a logistic regression.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`weight = 3
bias = 1

y_log = 1/(1+np.exp(-(weight*x+bias)))
f, ax = plt.subplots()
ax.plot(x, y_log, 'o')
ax.set_xlabel('x_i')
ax.set_ylabel('p(x)')
ax.set_title("logistic regression");
`})}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:i,alt:`png`})}),`
`,(0,t.jsxs)(l.p,{children:[`We can use this logistic regression for labelling, but simply deciding that the label is 0, if `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mi,{children:`p`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(l.mo,{children:`<`}),(0,t.jsxs)(l.mfrac,{children:[(0,t.jsx)(l.mn,{children:`1`}),(0,t.jsx)(l.mn,{children:`2`})]})]}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`p(x) <\\frac{1}{2}`})]})})}),(0,t.jsxs)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`p`}),(0,t.jsx)(l.span,{className:`mopen`,children:`(`}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`mclose`,children:`)`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(l.span,{className:`mrel`,children:`<`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1.1901em`,verticalAlign:`-0.345em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mopen nulldelimiter`}),(0,t.jsx)(l.span,{className:`mfrac`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsxs)(l.span,{className:`vlist`,style:{height:`0.8451em`},children:[(0,t.jsxs)(l.span,{style:{top:`-2.655em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:`2`})})})]}),(0,t.jsxs)(l.span,{style:{top:`-3.23em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`frac-line`,style:{borderBottomWidth:`0.04em`}})]}),(0,t.jsxs)(l.span,{style:{top:`-3.394em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:`1`})})})]})]}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.345em`},children:(0,t.jsx)(l.span,{})})})]})}),(0,t.jsx)(l.span,{className:`mclose nulldelimiter`})]})]})]})]}),` and and 1 if `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsxs)(l.mrow,{children:[(0,t.jsx)(l.mi,{children:`p`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`(`}),(0,t.jsx)(l.mi,{children:`x`}),(0,t.jsx)(l.mo,{stretchy:`false`,children:`)`}),(0,t.jsx)(l.mo,{children:`>`}),(0,t.jsxs)(l.mfrac,{children:[(0,t.jsx)(l.mn,{children:`1`}),(0,t.jsx)(l.mn,{children:`2`})]})]}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`p(x) > \\frac{1}{2}`})]})})}),(0,t.jsxs)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1em`,verticalAlign:`-0.25em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`p`}),(0,t.jsx)(l.span,{className:`mopen`,children:`(`}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`x`}),(0,t.jsx)(l.span,{className:`mclose`,children:`)`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,t.jsx)(l.span,{className:`mrel`,children:`>`}),(0,t.jsx)(l.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`1.1901em`,verticalAlign:`-0.345em`}}),(0,t.jsxs)(l.span,{className:`mord`,children:[(0,t.jsx)(l.span,{className:`mopen nulldelimiter`}),(0,t.jsx)(l.span,{className:`mfrac`,children:(0,t.jsxs)(l.span,{className:`vlist-t vlist-t2`,children:[(0,t.jsxs)(l.span,{className:`vlist-r`,children:[(0,t.jsxs)(l.span,{className:`vlist`,style:{height:`0.8451em`},children:[(0,t.jsxs)(l.span,{style:{top:`-2.655em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:`2`})})})]}),(0,t.jsxs)(l.span,{style:{top:`-3.23em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`frac-line`,style:{borderBottomWidth:`0.04em`}})]}),(0,t.jsxs)(l.span,{style:{top:`-3.394em`},children:[(0,t.jsx)(l.span,{className:`pstrut`,style:{height:`3em`}}),(0,t.jsx)(l.span,{className:`sizing reset-size6 size3 mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:(0,t.jsx)(l.span,{className:`mord mtight`,children:`1`})})})]})]}),(0,t.jsx)(l.span,{className:`vlist-s`,children:`​`})]}),(0,t.jsx)(l.span,{className:`vlist-r`,children:(0,t.jsx)(l.span,{className:`vlist`,style:{height:`0.345em`},children:(0,t.jsx)(l.span,{})})})]})}),(0,t.jsx)(l.span,{className:`mclose nulldelimiter`})]})]})]})]}),`.`]}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`def get_accuracy(weight: float, bias: float, xvals: List[float], yvals: List[int]
) -> Union[float, List[int]]:
    """
    Calculates the accuracy of the logistic regression for a given set of data.

    Args:
      weight: the training parameter for the weight
      bias: the training parameter for the bias
      xvals: the input values
      yvals: the labels
    Returns:
      The accuracy and the predicted labels.
    """
    pred_labels = np.zeros(len(xvals))
    accurate_prediction = 0
    for ii, xinput, yinput in zip(range(len(xvals)), xvals, yvals.astype(int)):
        # set the circuit parameter
        y_log = 1/(1+np.exp(-(weight*xinput+bias)))
        pred_label = 1.0*(y_log>1/2)
        pred_labels[ii] = pred_label
        if yinput == pred_label:
            accurate_prediction += 1
    return accurate_prediction / len(yvals), pred_labels
`})}),`
`,(0,t.jsx)(l.p,{children:`And now we can have a look at the labeling with some randomly guessed initial values.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`weight = -0.8
bias = 0
accuracy, y_pred = get_accuracy(bias = bias, weight=weight, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

print(f"The circuit has an accuracy of {accuracy}")
f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()
`})}),`
`,(0,t.jsx)(l.p,{children:`The circuit has an accuracy of 0.85`}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:a,alt:`png`})}),`
`,(0,t.jsx)(l.p,{children:`As we can see above there is quite a regime, where the model does to predict the labels very well. This can be improved by training the model parameters systematically.`}),`
`,(0,t.jsx)(l.h2,{children:`Training the minimalistic algorithm`}),`
`,(0,t.jsxs)(l.p,{children:[`To improve the performance of the circuit, we have to train it. This basically involves the minimization of some loss function as a function of the circuit parameters `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsx)(l.mi,{children:`W`})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`W`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6833em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,style:{marginRight:`0.1389em`},children:`W`})]})})]}),` and `,(0,t.jsxs)(l.span,{className:`katex`,children:[(0,t.jsx)(l.span,{className:`katex-mathml`,children:(0,t.jsx)(l.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,t.jsxs)(l.semantics,{children:[(0,t.jsx)(l.mrow,{children:(0,t.jsx)(l.mi,{children:`b`})}),(0,t.jsx)(l.annotation,{encoding:`application/x-tex`,children:`b`})]})})}),(0,t.jsx)(l.span,{className:`katex-html`,"aria-hidden":`true`,children:(0,t.jsxs)(l.span,{className:`base`,children:[(0,t.jsx)(l.span,{className:`strut`,style:{height:`0.6944em`}}),(0,t.jsx)(l.span,{className:`mord mathnormal`,children:`b`})]})})]}),`. In this example, we can simply calculate the accuracy of the circuit as a function of the bias and obtain its minimimum.`]}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`weight = -1

Nbias = 101
biases = np.linspace(-2, 2, Nbias)
accuracies = np.zeros(Nbias)

for ii, bias_val in enumerate(tqdm(biases)):
    accuracy, y_pred = get_accuracy(bias = bias_val, weight=weight, xvals=x_train, yvals=y_train)
    accuracies[ii] = accuracy
`})}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`opt_bias = biases[accuracies.argmax()]

f, ax = plt.subplots()
ax.plot(biases, accuracies)
ax.axvline(opt_bias, color="C1", label="optimal bias")
ax.set_ylabel("accuracy")
ax.set_xlabel("biases")
ax.legend()
`})}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:o,alt:`png`})}),`
`,(0,t.jsx)(l.p,{children:`We clearly identify a optimal value for the bias at which the accuracy is maximal. This allows to test the accuracy on the optimal value of the weights again to obtain.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`accuracy, y_pred = get_accuracy(bias = opt_bias , weight= weight, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()


print(f"The trained circuit has an accuracy of {accuracy:.2}")
`})}),`
`,(0,t.jsx)(l.p,{children:`The trained circuit has an accuracy of 1.0`}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:s,alt:`png`})}),`
`,(0,t.jsx)(l.h2,{children:`Testing the algorithm`}),`
`,(0,t.jsx)(l.p,{children:`Having finished the training, we can test the circuit now on data points that it has never seen.`}),`
`,(0,t.jsx)(l.pre,{children:(0,t.jsx)(l.code,{className:`language-python`,children:`test_accuracy, y_test_pred = get_accuracy(
    bias = opt_bias, weight=weight, xvals=x_test, yvals=y_test
)

false_label = abs(y_test_pred - y_test) > 0

x_false = x_test[false_label]
y_false = y_test_pred[false_label]

print(f"The circuit has a test accuracy of {test_accuracy:.2}")
f, ax = plt.subplots()
ax.plot(x_test, y_test_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend();
`})}),`
`,(0,t.jsx)(l.p,{children:`The circuit has a test accuracy of 1.0`}),`
`,(0,t.jsx)(l.p,{children:(0,t.jsx)(l.img,{src:c,alt:`png`})}),`
`,(0,t.jsx)(l.h2,{children:`Summary of classical supervised learning`}),`
`,(0,t.jsx)(l.p,{children:`In this tutorial, we studied some basic concepts like training and classification for an extremely simple case. We saw:`}),`
`,(0,t.jsxs)(l.ul,{children:[`
`,(0,t.jsx)(l.li,{children:`the existence of a classification algorithm.`}),`
`,(0,t.jsx)(l.li,{children:`How it relates input and output label.`}),`
`,(0,t.jsx)(l.li,{children:`How it is trained.`}),`
`,(0,t.jsx)(l.li,{children:`How it is tested on test data.`}),`
`]}),`
`,(0,t.jsxs)(l.p,{children:[`In the `,(0,t.jsx)(l.a,{href:`https://colab.research.google.com/drive/1XMkIBrU1lBLTT-oVufVTifHivss0HDI1?usp=sharing`,children:`first tutorial on QML`}),`, we will see how this translate in the simplest fashion to quantum algorithms.`]})]})}function d(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(u,{...e})}):u(e)}export{d as default,l as frontmatter};