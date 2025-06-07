interface props{
    text:string 
}
 export default function Input({text}:props) {
     return <div className="font-bold text-[#000000] text=xl p-2 ">
        {text}
    </div>
}