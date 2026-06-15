import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, FileText, User, Mail, Phone, ChevronRight, Lock, Key, Camera } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, database } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import '../home.css';

export const WorkerProfilePage: React.FC = () => {
  const { profile, setProfileAndRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/select-role');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit to 1.5MB to stay safe in database limits)
    if (file.size > 1.5 * 1024 * 1024) {
      setToastMsg('Image size must be less than 1.5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        await update(ref(database, `users/${profile?.uid}`), { photoUrl: base64String });
        if (profile) {
          setProfileAndRole({ ...profile, photoUrl: base64String });
        }
        setToastMsg('Profile picture updated successfully!');
      } catch (err) {
        console.error(err);
        setToastMsg('Failed to update profile picture.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    setModalError('');
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setToastMsg('Password updated successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        setModalError('No authenticated user session found. Please log in again.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setModalError('This action requires recent authentication. Please log out and log back in, then try again.');
      } else {
        setModalError(err.message || 'Failed to update password.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DY';

  return (
    <div className="home-container animate-fade-in">
      <Toast message={toastMsg} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} type="success" />

      <header className="home-header">
        <h2 className="section-title">My Profile</h2>
      </header>
      
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 600, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Card Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <input
            type="file"
            id="profile-photo-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          <div 
            onClick={() => document.getElementById('profile-photo-input')?.click()}
            style={{
              position: 'relative',
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 16,
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            {profile?.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              initials
            )}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'opacity 0.2s',
            }}>
              <Camera size={14} />
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 6px 0' }}>{profile?.fullName}</h2>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ECFDF5',
            color: 'var(--color-success)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            marginTop: '8px'
          }}>
            <Briefcase size={14} />
            <span>Worker / Freelancer</span>
          </div>
        </div>

        {/* Account Details Box */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: '18px',
          border: '1px solid var(--color-border)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-light)', margin: '0 0 16px 0', letterSpacing: '0.8px' }}>
            ACCOUNT DETAILS
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0
              }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-medium)', fontWeight: 600 }}>Full Name</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)' }}>{profile?.fullName}</div>
              </div>
            </div>

            {/* Email Address Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0
              }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-medium)', fontWeight: 600 }}>Email Address</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)', wordBreak: 'break-all' }}>{profile?.email}</div>
              </div>
            </div>

            {/* Phone Number Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0
              }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-medium)', fontWeight: 600 }}>Phone Number</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)' }}>{profile?.phoneNumber || 'Not Provided'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Box */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: '18px',
          border: '1px solid var(--color-border)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-light)', margin: '0 0 16px 0', letterSpacing: '0.8px' }}>
            MANAGEMENT
          </h3>
          
          <div 
            onClick={() => navigate('/worker/manage-reports')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0
              }}>
                <FileText size={20} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
                Manage Your Reports
              </span>
            </div>
            <ChevronRight size={20} color="var(--color-text-medium)" />
          </div>
        </div>

        {/* Security Box */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: '18px',
          border: '1px solid var(--color-border)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-light)', margin: '0 0 16px 0', letterSpacing: '0.8px' }}>
            SECURITY
          </h3>
          
          <div 
            onClick={() => setShowPasswordModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0
              }}>
                <Lock size={20} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
                Change Password
              </span>
            </div>
            <ChevronRight size={20} color="var(--color-text-medium)" />
          </div>
        </div>

        {/* Log Out Button */}
        <div style={{ marginTop: '12px' }}>
          <Button 
            title="Sign Out" 
            onClick={handleLogout} 
            variant="outline" 
            icon={<LogOut size={18} />} 
            style={{ width: '100%', color: 'var(--color-error)', borderColor: 'var(--color-error)', height: '48px', borderRadius: '12px' }} 
          />
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={24} color="var(--color-success)" />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0 }}>
                Change Password
              </h3>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>
              Enter a new secure password of at least 6 characters.
            </p>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    padding: '0 16px',
                    outline: 'none',
                    fontSize: '15px'
                  }}
                />
                {modalError && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600, marginTop: '4px' }}>
                    {modalError}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setModalError('');
                  }}
                  style={{
                    flex: 1,
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'white',
                    color: 'var(--color-text-medium)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    height: '46px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {changingPassword ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
