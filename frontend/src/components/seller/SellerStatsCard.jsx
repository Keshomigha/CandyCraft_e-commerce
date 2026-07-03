export default function SellerStatsCard({ icon, value, label, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
