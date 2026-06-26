import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/layout/Topbar';
import { initials, avatarGradient } from '../utils/helpers';
import toast from 'react-hot-toast';
export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form,setForm] = useState({ first_name:user?.first_name||'', last_name:user?.last_name||'', email:user?.email||'' });
  const [saving,setSaving] = useState(false);
  const [pwForm,setPwForm] = useState({ old_password:'', new_password:'', confirm:'' });
  const name = `${user?.first_name||''} ${user?.last_name||''}`.trim()||user?.username||'User';
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try { await updateProfile(form); } finally { setSaving(false); }
  };
  const handlePw = e => {
    e.preventDefault();
    if (pwForm.new_password!==pwForm.confirm) { toast.error('Passwords do not match.'); return; }
    toast.success('Password change coming soon!');
    setPwForm({old_password:'',new_password:'',confirm:''});
  };
  return (
    <div>
      <Topbar title="👤 Profile" subtitle="Manage your account settings"/>
      <div className="page-content" style={{maxWidth:700}}>
        <div className="card" style={s.card}>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:avatarGradient(user?.username||'U'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff',flexShrink:0}}>{initials(name)}</div>
            <div>
              <h2 style={{fontSize:20,fontWeight:700}}>{name}</h2>
              <p style={{fontSize:13.5,color:'var(--text-3)',marginTop:2}}>@{user?.username}</p>
              <p style={{fontSize:12,color:'var(--text-4)',marginTop:4}}>Member since {user?.date_joined?.slice(0,10)||'—'}</p>
            </div>
          </div>
        </div>
        <div className="card" style={s.card}>
          <h3 style={s.sec}>Personal Information</h3>
          <form onSubmit={handleSave}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group"><label className="form-label">First name</label><input className="form-control" value={form.first_name} onChange={e=>set('first_name',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Last name</label><input className="form-control" value={form.last_name} onChange={e=>set('last_name',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Email address</label><input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Username</label><input className="form-control" value={user?.username||''} disabled style={{opacity:0.6,cursor:'not-allowed'}}/></div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'✓ Save changes'}</button>
          </form>
        </div>
        <div className="card" style={s.card}>
          <h3 style={s.sec}>Change Password</h3>
          <form onSubmit={handlePw}>
            <div className="form-group"><label className="form-label">Current password</label><input className="form-control" type="password" value={pwForm.old_password} onChange={e=>setPwForm(f=>({...f,old_password:e.target.value}))}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="form-group"><label className="form-label">New password</label><input className="form-control" type="password" value={pwForm.new_password} onChange={e=>setPwForm(f=>({...f,new_password:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Confirm</label><input className="form-control" type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/></div>
            </div>
            <button type="submit" className="btn btn-secondary">Update password</button>
          </form>
        </div>
        <div className="card" style={{...s.card,border:'1px solid var(--red-border)'}}>
          <h3 style={{...s.sec,color:'var(--red)'}}>⚠ Danger Zone</h3>
          <p style={{fontSize:13,color:'var(--text-3)',marginBottom:14}}>Deleting your account is permanent and cannot be undone.</p>
          <button className="btn btn-danger" onClick={()=>toast.error('Please contact support to delete your account.')}>Delete account</button>
        </div>
      </div>
    </div>
  );
}
const s = { card:{ padding:'22px 24px', marginBottom:18 }, sec:{ fontSize:15, fontWeight:700, color:'var(--text-1)', marginBottom:18 } };
