import { useEffect, useMemo, useState } from "react";

const KEY = "easyorder-qr-pos-v1";
const starterMenu = [
  ["Classic Burger","Mains",249],["Chicken Tikka","Mains",329],
  ["Paneer Tikka","Starters",289],["French Fries","Sides",149],
  ["Masala Fries","Sides",179],["Cold Coffee","Drinks",139],
  ["Fresh Lime Soda","Drinks",99],["Mojito","Drinks",169],
  ["Brownie","Desserts",159],["Cheesecake","Desserts",199]
].map((x,i)=>({id:`p${i+1}`,name:x[0],category:x[1],price:x[2],available:true}));
const starterTables=Array.from({length:12},(_,i)=>({id:i+1,seats:i<4?2:i<10?4:6,status:"Available"}));
const defaults={businessName:"Karma POS",upiId:"yourupi@upi",payeeName:"Karma POS",tax:5};
const money=n=>`₹${Number(n||0).toFixed(2)}`;
const stamp=()=>new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
function initial(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x)return x}catch{}return{menu:starterMenu,tables:starterTables,orders:[],settings:defaults}}

export default function App(){
 const [data,setData]=useState(initial),[page,setPage]=useState("POS"),[cat,setCat]=useState("All"),
 [search,setSearch]=useState(""),[table,setTable]=useState(1),[cart,setCart]=useState([]),
 [payment,setPayment]=useState(null),[settings,setSettings]=useState(data.settings);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(data)),[data]);
 const cats=["All",...new Set(data.menu.map(x=>x.category))];
 const products=data.menu.filter(x=>x.available&&(cat==="All"||x.category===cat)&&x.name.toLowerCase().includes(search.toLowerCase()));
 const subtotal=cart.reduce((s,x)=>s+x.price*x.qty,0),tax=subtotal*(Number(data.settings.tax||0)/100),total=subtotal+tax;
 const paid=data.orders.filter(x=>x.status==="Paid"),sales=paid.reduce((s,x)=>s+x.total,0);
 const add=p=>setCart(c=>{const f=c.find(x=>x.id===p.id);return f?c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}]});
 const qty=(id,d)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty+d}:x).filter(x=>x.qty>0));
 const update=(id,status)=>setData(d=>({...d,orders:d.orders.map(o=>o.id===id?{...o,status}:o)}));
 const createOrder=()=>{if(!cart.length)return;const o={id:`ORD-${Date.now().toString().slice(-6)}`,table,items:cart,subtotal,tax,total,status:"Awaiting payment",payment:"UPI QR",createdAt:stamp()};setData(d=>({...d,orders:[o,...d.orders],tables:d.tables.map(t=>t.id===table?{...t,status:"Occupied"}:t)}));setCart([]);setPayment(o)};
 const print=()=>window.print();
 const addProduct=()=>{const name=prompt("Item name");if(!name)return;const price=Number(prompt("Price in INR","100"));if(!price)return;const category=prompt("Category","Mains")||"Mains";setData(d=>({...d,menu:[...d.menu,{id:`p${Date.now()}`,name,price,category,available:true}]}))};
 const qrData=payment?`upi://pay?pa=${encodeURIComponent(data.settings.upiId)}&pn=${encodeURIComponent(data.settings.payeeName)}&am=${payment.total.toFixed(2)}&cu=INR`:"";
 const qrUrl=payment?`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(qrData)}`:"";
 return <div className="app">
  <aside className="side"><div className="brand">🍽️ <span><b>{data.settings.businessName}</b><small>QR POS</small></span></div>
   {["POS","Orders","Tables","Menu","Dashboard","Settings"].map(x=><button key={x} onClick={()=>setPage(x)} className={page===x?"nav active":"nav"}>{({POS:"🛒",Orders:"🧾",Tables:"▦",Menu:"☷",Dashboard:"▥",Settings:"⚙"}[x])} {x}</button>)}
   <div className="sideNote">Frontend only<br/>Local storage<br/>UPI QR — no gateway</div>
  </aside>
  <main><header><div><h1>{page}</h1><p>{page==="POS"?"Create an order and collect UPI payment by QR":"Karma POS local POS"}</p></div><div className="stats"><span>Sales <b>{money(sales)}</b></span><span>Orders <b>{data.orders.length}</b></span><span>Pending <b>{data.orders.filter(x=>x.status!=="Paid").length}</b></span></div></header>
  {page==="POS"&&<div className="pos"><section className="catalog">
   <div className="toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu..."/><select value={table} onChange={e=>setTable(Number(e.target.value))}>{data.tables.map(t=><option key={t.id} value={t.id}>Table {t.id} · {t.seats} seats</option>)}</select></div>
   <div className="chips">{cats.map(x=><button key={x} className={cat===x?"chip selected":"chip"} onClick={()=>setCat(x)}>{x}</button>)}</div>
   <div className="grid">{products.map(p=><button className="product" key={p.id} onClick={()=>add(p)}><div className="emoji">{p.category==="Drinks"?"🥤":p.category==="Desserts"?"🍰":p.category==="Sides"?"🍟":"🍽️"}</div><b>{p.name}</b><small>{p.category}</small><strong>{money(p.price)}</strong></button>)}</div>
  </section>
  <aside className="cart"><div className="cartHead"><b>Current order<small>Table {table}</small></b><button onClick={()=>setCart([])} className="plain">Clear</button></div>
   <div className="items">{!cart.length&&<div className="empty">Add items from the menu</div>}{cart.map(i=><div className="row" key={i.id}><div><b>{i.name}</b><small>{money(i.price)} each</small></div><div className="qty"><button onClick={()=>qty(i.id,-1)}>−</button><span>{i.qty}</span><button onClick={()=>qty(i.id,1)}>+</button></div><strong>{money(i.price*i.qty)}</strong></div>)}</div>
   <div className="totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Tax ({data.settings.tax}%)</span><b>{money(tax)}</b></div><div className="grand"><span>Total</span><b>{money(total)}</b></div></div>
   <button disabled={!cart.length} className="pay" onClick={createOrder}>Create order & show QR →</button>
  </aside></div>}
  {page==="Orders"&&<Orders orders={data.orders} update={update}/>}
  {page==="Tables"&&<section className="card"><div className="head"><div><h2>Tables</h2><p>Select a table to start an order.</p></div></div><div className="tableGrid">{data.tables.map(t=><button key={t.id} className={`table ${t.status.toLowerCase()}`} onClick={()=>{setTable(t.id);setPage("POS")}}><b>{t.id}</b><span>{t.seats} seats</span><small>{t.status}</small></button>)}</div></section>}
  {page==="Menu"&&<section className="card"><div className="head"><div><h2>Menu</h2><p>Menu is stored locally in this browser.</p></div><button className="primary" onClick={addProduct}>+ Add item</button></div>{data.menu.map(p=><div className="menuRow" key={p.id}><span className="emoji">{p.category==="Drinks"?"🥤":"🍽️"}</span><div className="grow"><b>{p.name}</b><small>{p.category}</small></div><b>{money(p.price)}</b><button className={p.available?"avail on":"avail"} onClick={()=>setData(d=>({...d,menu:d.menu.map(x=>x.id===p.id?{...x,available:!x.available}:x)}))}>{p.available?"Available":"Hidden"}</button></div>)}</section>}
  {page==="Dashboard"&&<section className="dash"><div className="metrics"><div><small>Total sales</small><b>{money(sales)}</b></div><div><small>Total orders</small><b>{data.orders.length}</b></div><div><small>Awaiting payment</small><b>{data.orders.filter(x=>x.status!=="Paid").length}</b></div></div><div className="card"><h2>Recent orders</h2>{data.orders.slice(0,8).map(o=><div className="recent" key={o.id}><span><b>{o.id}</b><small>Table {o.table} · {o.createdAt}</small></span><b>{money(o.total)}</b><span className={o.status==="Paid"?"paid":"pending"}>{o.status}</span></div>)}</div></section>}
  {page==="Settings"&&<section className="card settings"><div className="head"><div><h2>Settings</h2><p>Configure the UPI account used by the QR.</p></div><button className="primary" onClick={()=>{setData(d=>({...d,settings}));alert("Settings saved")}}>Save settings</button></div>
   <label>Business name<input value={settings.businessName} onChange={e=>setSettings({...settings,businessName:e.target.value})}/></label>
   <label>UPI ID<input value={settings.upiId} onChange={e=>setSettings({...settings,upiId:e.target.value})}/></label>
   <label>Payee name<input value={settings.payeeName} onChange={e=>setSettings({...settings,payeeName:e.target.value})}/></label>
   <label>Tax %<input type="number" value={settings.tax} onChange={e=>setSettings({...settings,tax:Number(e.target.value)})}/></label>
   <div className="notice">The QR contains a standard UPI payment URI with the exact order amount. There is no Razorpay, payment gateway, database, or automatic payment verification.</div>
  </section>}</main>
  {payment&&<div className="overlay"><div className="modal"><button className="close" onClick={()=>setPayment(null)}>×</button><h2>Scan to pay</h2><p>{payment.id} · Table {payment.table}</p><img className="qr" src={qrUrl} alt="UPI payment QR"/><h1>{money(payment.total)}</h1><p className="muted">Customer scans with any UPI app. Staff manually confirms payment.</p><div className="actions"><button className="secondary" onClick={print}>Print bill</button><button className="primary" onClick={()=>{update(payment.id,"Paid");setPayment(null)}}>Confirm payment received</button></div></div></div>}
  <div className="printOnly"><h2>{data.settings.businessName}</h2><p>Order {payment?.id||""} · Table {payment?.table||""}</p><hr/>{payment?.items?.map(i=><div className="receiptLine" key={i.id}><span>{i.qty} × {i.name}</span><span>{money(i.qty*i.price)}</span></div>)}<hr/><div className="receiptLine"><b>Total</b><b>{money(payment?.total)}</b></div><p>Payment: UPI QR</p><p>Thank you!</p></div>
 </div>
}
function Orders({orders,update}){
 return <section className="card"><div className="head"><div><h2>Orders</h2><p>Orders are kept in browser local storage.</p></div></div><div className="tableWrap"><table><thead><tr><th>Order</th><th>Table</th><th>Time</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{!orders.length&&<tr><td colSpan="6" className="empty">No orders yet.</td></tr>}{orders.map(o=><tr key={o.id}><td><b>{o.id}</b><small>{o.items.map(i=>`${i.qty}× ${i.name}`).join(", ")}</small></td><td>{o.table}</td><td>{o.createdAt}</td><td><b>{money(o.total)}</b></td><td><span className={o.status==="Paid"?"paid":"pending"}>{o.status}</span></td><td>{o.status!=="Paid"&&<button className="small" onClick={()=>update(o.id,"Paid")}>Mark paid</button>}</td></tr>)}</tbody></table></div></section>
}