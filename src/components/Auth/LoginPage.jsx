import React,{useState}from'react';
import{Eye,EyeOff}from'lucide-react';
import{useNavigate}from'react-router-dom';
import{NHLogo}from'../Layout/Header';
import{validatePassword}from'../../utils';
import'./login.css';

export default function LoginPage({onLoginSuccess}){
 const navigate=useNavigate();
 const[formData,setFormData]=useState({email:'',password:''});
 const[errors,setErrors]=useState({});
 const[isLoading,setIsLoading]=useState(false);
 const[showPassword,setShowPassword]=useState(false);
 const change=e=>{setFormData({...formData,[e.target.name]:e.target.value});setErrors({...errors,[e.target.name]:''})};
 const submit=async e=>{e.preventDefault();const next={};if(!formData.email)next.email='Email is required';if(!validatePassword(formData.password))next.password='Password must be at least 8 characters';if(Object.keys(next).length){setErrors(next);return}setIsLoading(true);await new Promise(r=>setTimeout(r,700));localStorage.setItem('authToken','mock-token');onLoginSuccess();navigate('/dashboard')};
 return <main className="login-page"><section className="login-card"><div className="login-heading"><NHLogo/><h1>NH Terminal</h1><p>Enter Your Details Below</p></div><form onSubmit={submit}><label>Email<input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={change}/>{errors.email&&<small>{errors.email}</small>}</label><label>Password<div className="password-field"><input type={showPassword?'text':'password'} name="password" placeholder="••••••••" value={formData.password} onChange={change}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff/>:<Eye/>}</button></div>{errors.password&&<small>{errors.password}</small>}</label><a href="#" className="forgot-link">Forgot Password?</a><button className="login-submit" disabled={isLoading}>{isLoading?'Loading...':'Log In'}</button></form><div className="signup-copy">Don't Have Account? <a href="#">Sign Up</a></div></section></main>
}
