import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, tableRow } from '../../utils/motionVariants';

const ROLE_STYLES = {
  buyer:  'bg-blue-100 text-blue-700',
  seller: 'bg-purple-100 text-purple-700',
  admin:  'bg-gray-800 text-white',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function UserTable({ users, currentUserId, onToggleStatus, onDelete, busyId }) {
  if (users.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">👥</p>
        <p className="text-gray-400 text-sm">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === 'admin';
              const locked = isSelf || isAdmin;
              const isSuspended = u.status === 'suspended';
              return (
                <motion.tr key={u.id} variants={tableRow} exit="exit" className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#F4A261] flex-shrink-0">
                        {u.name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {u.name} {isSelf && <span className="text-gray-400 font-normal">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmt(u.created_at)}</td>
                  <td className="px-6 py-3 text-right">
                    {locked ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={busyId === u.id}
                          onClick={() => onToggleStatus(u)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60
                            ${isSuspended
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={busyId === u.id}
                          onClick={() => onDelete(u)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          Delete
                        </motion.button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
}
